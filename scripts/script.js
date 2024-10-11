let map;
let userMarker;
let markers = [];  // Armazena todos os marcadores para filtragem
let currentTypeFilter = 'ALL';  // Armazena o filtro atual por tipo
let currentDateFilter = 'ALL';  // Armazena o filtro atual por data

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: { lat: -11.327677811335677, lng: -41.86379548388087 },
        zoom: 14,
    });

    // Tenta obter a localização do usuário
    if(navigator.geolocation) {
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
                    title: "Você está aqui!",
                    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                });

                // Centraliza o mapa na localização do usuário
                map.setCenter(userLocation);

                // Busca atividades próximas usando a API
                fetchNearbyActivities(userLocation.lat, userLocation.lng, 150);  // Raio de 150km
            },
            () => {
                handleLocationError(true, map.getCenter());
            }
        );
    } else
        // Navegador não suporta geolocalização
        handleLocationError(false, map.getCenter());
}

initMap();

// Função para buscar atividades próximas
function fetchNearbyActivities(lat, lon, raio) {
    fetch(`https://sncetapp-backend-e5ebfd28a45d.herokuapp.com/activities/nearby?lat=${lat}&lon=${lon}&raio=${raio}`)
        .then(response => response.json())
        .then(activities => {
            activities.forEach(activity => {
                const activityPosition = { lat: activity.lat, lng: activity.lon };

                // Escolhe o ícone baseado no tipo da atividade
                const icon = getActivityIcon(activity.tipoAtividade);

                // Coloca um marcador no mapa para cada atividade
                const marker = new google.maps.Marker({
                    position: activityPosition,
                    map: map,
                    title: activity.titulo,
                    icon: icon
                });

                // Formata os palestrantes em uma lista
                const palestrantesFormatted = activity.palestrantes.join(', ');

                // Adiciona um infoWindow ao clicar no marcador
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <h3 style="color: black; margin-bottom: 10px;">${activity.titulo}</h3>
                        <p style="color: black;"><strong>Tipo:</strong> ${activity.tipoAtividade}</p>
                        <p style="color: black;"><strong>Descrição:</strong> ${activity.descricao}</p>
                        <p style="color: black;"><strong>Local:</strong> ${activity.local}</p>
                        <p style="color: black;"><strong>Data:</strong> ${activity.data}</p>
                        <p style="color: black;"><strong>Horário:</strong> ${activity.horario}</p>
                        <p style="color: black;"><strong>Palestrantes:</strong> ${palestrantesFormatted}</p>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                // Armazena o marcador junto com o tipo e a data da atividade
                markers.push({ 
                    marker, 
                    tipoAtividade: activity.tipoAtividade, 
                    dataAtividade: activity.data 
                });
            });
        })
        .catch(error => {
            console.error('Erro ao buscar atividades:', error);
        });
}

// Função para obter o ícone personalizado baseado no tipo de atividade
function getActivityIcon(tipoAtividade) {
    switch(tipoAtividade) {
        case 'PALESTRA':
            return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
        case 'OFICINA':
            return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
        case 'MINICURSO':
            return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
        case 'TRABALHO':
            return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
        default:
            return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
}

// Função de filtragem de atividades por tipo
function filterActivitiesByType(type) {
    currentTypeFilter = type;  // Atualiza o filtro atual por tipo
    applyFilters();
}

// Função de filtragem de atividades por data
function filterActivitiesByDate(date) {
    currentDateFilter = date;  // Atualiza o filtro atual por data
    applyFilters();
}

// Aplica os filtros de tipo e data
function applyFilters() {
    markers.forEach(({ marker, tipoAtividade, dataAtividade }) => {
        const matchesType = currentTypeFilter === 'ALL' || tipoAtividade === currentTypeFilter;
        const matchesDate = currentDateFilter === 'ALL' || dataAtividade === currentDateFilter;

        if(matchesType && matchesDate) {
            marker.setMap(map);  // Mostra o marcador
        } else
            marker.setMap(null);  // Remove o marcador
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