const API_KEY = 'e89a2a3d9499981daad0e9cfed58ec3f';
const USERNAME = 'whocvt';
const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const CUSTOM_AVATAR = './avatar.jpg';

let allTracks = [];
let filteredTracks = [];
let currentPage = 1;
const tracksPerPage = 20;


const elements = {
    userAvatar: document.getElementById('userAvatar'),
    userAvatarImg: document.getElementById('userAvatarImg'),
    avatarInitial: document.getElementById('avatarInitial'),
    userName: document.getElementById('userName'),
    userStats: document.getElementById('userStats'),
    albumArt: document.getElementById('albumArt'),
    trackName: document.getElementById('trackName'),
    artistName: document.getElementById('artistName'),
    albumName: document.getElementById('albumName'),
    statusText: document.getElementById('statusText'),
    trackPlaycount: document.getElementById('trackPlaycount'),
    trackListeners: document.getElementById('trackListeners'),
    recentTracks: document.getElementById('recentTracks'),
    refreshBtn: document.getElementById('refreshBtn'),
    playingAnimation: document.getElementById('playingAnimation'),
    albumArtGlow: document.querySelector('.album-art-glow'),
    nowPlaying: document.getElementById('nowPlaying'),
    showAllBtn: document.getElementById('showAllBtn'),
    tracksModal: document.getElementById('tracksModal'),
    modalClose: document.getElementById('modalClose'),
    trackSearch: document.getElementById('trackSearch'),
    searchBtn: document.getElementById('searchBtn'),
    allTracksContainer: document.getElementById('allTracksContainer'),
    loadingSpinner: document.querySelector('.loading-spinner'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    updateNotification: document.getElementById('updateNotification'),
    notificationClose: document.getElementById('notificationClose'),
};

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function getTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
    if (diff < 604800) return Math.floor(diff / 86400) + ' д назад';
    return Math.floor(diff / 604800) + ' нед назад';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}








function setAlbumArtGlow(imageUrl) {
    if (imageUrl && imageUrl !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzMzMzMzMiLz4KPHN2ZyB3aWR0aD0iMTAwIiBoZWlnaD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iMTAwIiB5PSIxMDAiPgo8cGF0aCBkPSJNOCA1VjE5TDE5IDEyTDggNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K') {
        elements.albumArtGlow.style.backgroundImage = `url(${imageUrl})`;
        elements.albumArtGlow.style.opacity = '0.5';
    } else {
        elements.albumArtGlow.style.opacity = '0';
    }
}

async function fetchAPI(params) {
    const url = new URL(API_BASE);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('format', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function getUserInfo() {
    const data = await fetchAPI({
        method: 'user.getInfo',
        user: USERNAME
    });
    
    if (data && data.user) {
        const user = data.user;
        
        if (user.realname && user.realname.trim() !== '') {
            elements.avatarInitial.textContent = user.realname.charAt(0).toUpperCase();
        } else {
            elements.avatarInitial.textContent = USERNAME.charAt(0).toUpperCase();
        }
        
        if (CUSTOM_AVATAR && CUSTOM_AVATAR.trim() !== '') {
            const img = new Image();
            img.onload = () => {
                elements.userAvatarImg.src = CUSTOM_AVATAR;
                elements.userAvatarImg.style.display = 'block';
            };
            img.onerror = () => {
                elements.userAvatarImg.style.display = 'none';
            };
            img.src = CUSTOM_AVATAR;
        } else if (user.image && user.image.length > 0) {
            const avatarUrl = user.image.find(img => img.size === 'extralarge')?.['#text'] 
                           || user.image[user.image.length - 1]['#text'];
            
            if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                const img = new Image();
                img.onload = () => {
                    elements.userAvatarImg.src = avatarUrl;
                    elements.userAvatarImg.style.display = 'block';
                };
                img.onerror = () => {
                    elements.userAvatarImg.style.display = 'none';
                };
                img.src = avatarUrl;
            }
        }
        
        const playcount = formatNumber(parseInt(user.playcount));
        elements.userStats.textContent = `${playcount} прослушиваний`;
    }
}

async function getRecentTracks() {
    const data = await fetchAPI({
        method: 'user.getRecentTracks',
        user: USERNAME,
        limit: 20
    });
    
    if (data && data.recenttracks && data.recenttracks.track) {
        const tracks = data.recenttracks.track;
        
        if (tracks.length > 0) {
            const currentTrack = tracks[0];
            const isNowPlaying = currentTrack['@attr'] && currentTrack['@attr'].nowplaying === 'true';
            
            await updateCurrentTrack(currentTrack, isNowPlaying);
            
            const recentList = isNowPlaying ? tracks.slice(1, 11) : tracks.slice(0, 10);
            updateRecentTracksList(recentList);
        }
    }
}

async function updateCurrentTrack(track, isNowPlaying) {
    
    elements.trackName.textContent = track.name || '-';
    elements.artistName.textContent = track.artist['#text'] || track.artist.name || '-';
    elements.albumName.textContent = track.album['#text'] || '-';
    
    let albumArtUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzMzMzMzMiLz4KPHN2ZyB3aWR0aD0iMTAwIiBoZWlnaD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iMTAwIiB5PSIxMDAiPgo8cGF0aCBkPSJNOCA1VjE5TDE5IDEyTDggNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K';
    if (track.image && track.image.length > 0) {
        const largeImage = track.image[track.image.length - 1]['#text'];
        if (largeImage) albumArtUrl = largeImage;
    }
    elements.albumArt.src = albumArtUrl;
    setAlbumArtGlow(albumArtUrl);
    
    if (isNowPlaying) {
        elements.statusText.textContent = 'Сейчас играет';
        elements.playingAnimation.classList.add('active');
        document.querySelector('.status-dot').classList.remove('inactive');
    } else {
        const timestamp = track.date ? parseInt(track.date.uts) : Math.floor(Date.now() / 1000);
        elements.statusText.textContent = getTimeAgo(timestamp);
        elements.playingAnimation.classList.remove('active');
        document.querySelector('.status-dot').classList.add('inactive');
    }
    
    await getTrackInfo(track.name, track.artist['#text'] || track.artist.name);
}

async function getTrackInfo(trackName, artistName) {
    const data = await fetchAPI({
        method: 'track.getInfo',
        track: trackName,
        artist: artistName,
        username: USERNAME
    });
    
    if (data && data.track) {
        const track = data.track;
        
        if (track.playcount) {
            elements.trackPlaycount.textContent = formatNumber(parseInt(track.playcount));
        }
        
        if (track.listeners) {
            elements.trackListeners.textContent = formatNumber(parseInt(track.listeners));
        }
    }
}

function updateRecentTracksList(tracks) {
    elements.recentTracks.innerHTML = '';
    
    tracks.forEach(track => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        
        let albumArtUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzMzMzMzIi8+Cjxzdmcgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iMTUiIHk9IjE1Ij4KPHBhdGggZD0iTTggNVYxOUwxOSAxMkw4IDVaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+Cg==';
        if (track.image && track.image.length > 0) {
            const mediumImage = track.image[1]['#text'];
            if (mediumImage) albumArtUrl = mediumImage;
        }
        
        const timeAgo = track.date ? getTimeAgo(parseInt(track.date.uts)) : '';
        
        trackItem.innerHTML = `
            <img src="${albumArtUrl}" alt="Album" class="track-item-art">
            <div class="track-item-info">
                <div class="track-item-name">${track.name}</div>
                <div class="track-item-artist">${track.artist['#text'] || track.artist.name}</div>
            </div>
            <div class="track-item-time">${timeAgo}</div>
        `;
        
        trackItem.addEventListener('click', () => {
            updateCurrentTrack(track, false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        elements.recentTracks.appendChild(trackItem);
    });
}

async function loadAllData() {
    elements.nowPlaying.classList.add('loading');
    
    try {
        await Promise.all([
            getUserInfo(),
            getRecentTracks()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        elements.statusText.textContent = 'Ошибка загрузки';
    } finally {
        elements.nowPlaying.classList.remove('loading');
    }
}

function setupRefreshButton() {
    elements.refreshBtn.addEventListener('click', async () => {
        elements.refreshBtn.style.pointerEvents = 'none';
        await loadAllData();
        setTimeout(() => {
            elements.refreshBtn.style.pointerEvents = 'auto';
        }, 2000);
    });
}

function startAutoRefresh() {
    setInterval(async () => {
        await getRecentTracks();
    }, 10000);
}

async function fetchAllTracks() {
    try {
        if (elements.loadingSpinner) {
            elements.loadingSpinner.style.display = 'flex';
        }
        allTracks = [];
        let page = 1;
        let totalPages = 1;
        
        do {
            const response = await fetch(`${API_BASE}?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&page=${page}&limit=200`);
            const data = await response.json();
            
            if (data.recenttracks && data.recenttracks.track) {
                const tracks = Array.isArray(data.recenttracks.track) ? data.recenttracks.track : [data.recenttracks.track];
                allTracks = allTracks.concat(tracks);
                totalPages = parseInt(data.recenttracks['@attr'].totalPages);
                page++;
            } else {
                break;
            }
        } while (page <= totalPages && page <= 3);
        
        filteredTracks = [...allTracks];
        displayTracks();
        updatePagination();
    } catch (error) {
        console.error('Error fetching all tracks:', error);
        if (elements.allTracksContainer) {
            elements.allTracksContainer.innerHTML = '<div class="error-message">Ошибка загрузки треков</div>';
        }
    } finally {
        if (elements.loadingSpinner) {
            elements.loadingSpinner.style.display = 'none';
        }
    }
}

function displayTracks() {
    if (!elements.allTracksContainer) return;
    
    const startIndex = (currentPage - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const tracksToShow = filteredTracks.slice(startIndex, endIndex);
    
    elements.allTracksContainer.innerHTML = '';
    
    tracksToShow.forEach(track => {
        const trackElement = createTrackElement(track);
        elements.allTracksContainer.appendChild(trackElement);
    });
}

function createTrackElement(track) {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'modal-track-item';
    
    const imageUrl = track.image && track.image[2] ? track.image[2]['#text'] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIyMCIgeT0iMjAiPgo8cGF0aCBkPSJNOCA1VjE5TDE5IDEyTDggNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K';
    
    const timeAgo = track['@attr'] && track['@attr'].nowplaying ? 'Сейчас играет' : (track.date ? getTimeAgo(parseInt(track.date.uts)) : '');
    
    trackDiv.innerHTML = `
        <img src="${imageUrl}" alt="Album Art" class="modal-track-item-art" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIyMCIgeT0iMjAiPgo8cGF0aCBkPSJNOCA1VjE5TDE5IDEyTDggNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K'">
        <div class="modal-track-item-info">
            <div class="modal-track-item-name">${track.name || 'Неизвестный трек'}</div>
            <div class="modal-track-item-artist">${track.artist['#text'] || 'Неизвестный исполнитель'}</div>
        </div>
        <div class="modal-track-item-time">${timeAgo}</div>
    `;
    
    return trackDiv;
}

function updatePagination() {
    if (!elements.pageInfo || !elements.prevPage || !elements.nextPage) return;
    
    const totalPages = Math.ceil(filteredTracks.length / tracksPerPage);
    elements.pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    elements.prevPage.disabled = currentPage === 1;
    elements.nextPage.disabled = currentPage === totalPages || totalPages === 0;
}

function searchTracks() {
    if (!elements.trackSearch) return;
    
    const searchTerm = elements.trackSearch.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredTracks = [...allTracks];
    } else {
        filteredTracks = allTracks.filter(track => {
            const trackName = (track.name || '').toLowerCase();
            const artistName = (track.artist['#text'] || '').toLowerCase();
            return trackName.includes(searchTerm) || artistName.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    displayTracks();
    updatePagination();
}

function openModal() {
    if (!elements.tracksModal) return;
    
    elements.tracksModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    fetchAllTracks();
}

function closeModal() {
    if (!elements.tracksModal) return;
    
    elements.tracksModal.classList.remove('active');
    document.body.style.overflow = '';
    if (elements.trackSearch) {
        elements.trackSearch.value = '';
    }
}

function setupModalEventListeners() {
    if (elements.showAllBtn) {
        elements.showAllBtn.addEventListener('click', openModal);
    }
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', closeModal);
    }
    if (elements.tracksModal) {
        elements.tracksModal.addEventListener('click', (e) => {
            if (e.target === elements.tracksModal) {
                closeModal();
            }
        });
    }
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', searchTracks);
    }
    if (elements.trackSearch) {
        elements.trackSearch.addEventListener('input', searchTracks);
        elements.trackSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchTracks();
            }
        });
    }
    if (elements.prevPage) {
        elements.prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayTracks();
                updatePagination();
            }
        });
    }
    if (elements.nextPage) {
        elements.nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredTracks.length / tracksPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayTracks();
                updatePagination();
            }
        });
    }
}

function showUpdateNotification() {
    const notificationShown = localStorage.getItem('updateNotificationShown');
    const currentVersion = '1.2.0';
    const savedVersion = localStorage.getItem('siteVersion');
    
    if (!notificationShown || savedVersion !== currentVersion) {
        if (elements.updateNotification) {
            setTimeout(() => {
                elements.updateNotification.classList.add('show');
            }, 1000);
            
            localStorage.setItem('updateNotificationShown', 'true');
            localStorage.setItem('siteVersion', currentVersion);
        }
    }
}

function hideUpdateNotification() {
    if (elements.updateNotification) {
        elements.updateNotification.classList.remove('show');
    }
}

function setupNotificationEventListeners() {
    if (elements.notificationClose) {
        elements.notificationClose.addEventListener('click', hideUpdateNotification);
    }
    
    if (elements.updateNotification) {
        elements.updateNotification.addEventListener('click', (e) => {
            if (e.target === elements.updateNotification) {
                hideUpdateNotification();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupRefreshButton();
    startAutoRefresh();
    setupModalEventListeners();
    setupNotificationEventListeners();
    showUpdateNotification();
});
