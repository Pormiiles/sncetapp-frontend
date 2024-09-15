let map;
let userMarker;

async function initMap() {
const { Map } = await google.maps.importLibrary("maps");

map = new Map(document.getElementById("map"), {
    center: { lat: -11.327677811335677, lng: -41.86379548388087 },
    zoom: 8,
});

// Tenta obter a localização do usuário
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Coloca um marcador na localização do usuário
            userMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Você está aqui!"
            });

            // Centraliza o mapa na localização do usuário
            map.setCenter(userLocation);

            // Busca atividades próximas usando a API
            fetchNearbyActivities(userLocation.lat, userLocation.lng, 5);  // Raio de 2km
        },
        () => {
            handleLocationError(true, map.getCenter());
        }
    );
    } else {
        // Navegador não suporta geolocalização
        handleLocationError(false, map.getCenter());
    }
}

initMap();

// Função para buscar atividades próximas
function fetchNearbyActivities(lat, lon, raio) {
    fetch(`http://localhost:8080/activities/nearby?lat=${lat}&lon=${lon}&raio=${raio}`)
        .then(response => response.json())
        .then(activities => {
            activities.forEach(activity => {
                const activityPosition = { lat: activity.lat, lng: activity.lon };

                // Coloca um marcador no mapa para cada atividade
                const marker = new google.maps.Marker({
                    position: activityPosition,
                    map: map,
                    title: activity.titulo
                });

                // Adiciona um infoWindow ao clicar no marcador
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <h3>${activity.titulo}</h3>
                        <p>${activity.descricao}</p>
                        <p><strong>Local:</strong> ${activity.local}</p>
                        <p><strong>Data:</strong> ${activity.data}</p>
                        <p><strong>Horário:</strong> ${activity.horario}</p>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao buscar atividades:', error);
        });
}

// Tratamento de erros de geolocalização
function handleLocationError(browserHasGeolocation, pos) {
    const infoWindow = new google.maps.InfoWindow({
        position: pos,
        content: browserHasGeolocation
            ? 'Erro: Falha ao obter localização.'
            : 'Erro: Seu navegador não suporta geolocalização.'
    });
    infoWindow.open(map);
}