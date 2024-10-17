let map;
let userMarker;
let markers = [];  // Armazena todos os marcadores para filtragem
let currentTypeFilter = 'ALL';  // Armazena o filtro atual por tipo
let currentDateFilter = 'ALL';  // Armazena o filtro atual por data

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -11.327677811335677, lng: -41.86379548388087 },
        zoom: 14,
        mapId: "d28854f19dc87470"
    });

    // Tenta obter a localização do usuário
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Criar um novo PinElement para o AdvancedMarkerElement
                const pin = new PinElement({
                    background: '#FF0000',  // Cor vermelha para o marcador do usuário
                    borderColor: '#FFFFFF', // Cor da borda
                });

                // Coloca um marcador na localização do usuário com PinElement
                userMarker = new google.maps.marker.AdvancedMarkerElement({
                    position: userLocation,
                    map: map,
                    title: "Você está aqui!",
                    content: pin.element  // Passa o PinElement como conteúdo do marcador
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
    } else {
        // Navegador não suporta geolocalização
        handleLocationError(false, map.getCenter());
    }
}

// Função para buscar atividades próximas
function fetchNearbyActivities(lat, lon, raio) {
    fetch(`https://sncetapp-backend-e5ebfd28a45d.herokuapp.com/activities/nearby?lat=${lat}&lon=${lon}&raio=${raio}`)
        .then(response => response.json())
        .then(activities => {
            activities.forEach(activity => {
                const activityPosition = { lat: activity.lat, lng: activity.lon };

                // Escolhe o PinElement baseado no tipo da atividade
                const pin = getActivityIcon(activity.tipoAtividade);

                // Coloca um marcador no mapa para cada atividade
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: activityPosition,
                    map: map,
                    title: activity.titulo,
                    content: pin.element  // Usa o PinElement como ícone
                });

                // Formata os ministrantes em uma lista
                const ministrantesFormatted = activity.ministrantes.join(', ');

                // Adiciona um infoWindow ao clicar no marcador
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <h3 style="color: black; margin-bottom: 10px;">${activity.titulo}</h3>
                        <p style="color: black;"><strong>Tipo:</strong> ${activity.tipoAtividade}</p>
                        <p style="color: black;"><strong>Descrição:</strong> ${activity.descricao}</p>
                        <p style="color: black;"><strong>Local:</strong> ${activity.local}</p>
                        <p style="color: black;"><strong>Data:</strong> ${activity.data}</p>
                        <p style="color: black;"><strong>Horário:</strong> ${activity.horario}</p>
                        <p style="color: black;"><strong>Ministrantes:</strong> ${ministrantesFormatted}</p>
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
    let color = '#FF0000';  // Cor padrão (vermelha)

    switch(tipoAtividade) {
        case 'PALESTRA':
            color = '#0000FF';  // Azul
            break;
        case 'OFICINA':
            color = '#008000';  // Verde
            break;
        case 'MINICURSO':
            color = '#800080';  // Roxo
            break;
        case 'TRABALHO':
            color = '#FFFF00';  // Amarelo
            break;
    }

    // Retorna um novo PinElement com a cor especificada
    return new google.maps.marker.PinElement({
        background: color,
        borderColor: '#FFFFFF',
        glyphColor: "white"
    });
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
        const matchesDate = currentDateFilter === 'ALL' || dataAtividade.includes(currentDateFilter);

        if (matchesType && matchesDate) {
            marker.setMap(map);  // Mostra o marcador
        } else {
            marker.setMap(null);  // Remove o marcador
        }
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

// Inicializa o mapa
initMap();
