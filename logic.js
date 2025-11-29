let currentCity = 'Jakarta';
let isCelsius = true;
let isDark = true;
let refreshTimer;
let charts = {}; 

const dom = {
    input: document.getElementById('cityInput'),
    btn: document.getElementById('searchBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    favBtn: document.getElementById('favBtn'),
    themeBtn: document.getElementById('themeBtn'),
    unitBtn: document.getElementById('unitBtn'),
    favBar: document.getElementById('favoritesBar'),
    loading: document.getElementById('loading'),
    dashboard: document.getElementById('dashboard'),
    
    cityName: document.getElementById('cityName'),
    tempDisplay: document.getElementById('tempDisplay'),
    desc: document.getElementById('weatherDesc'),
    timestamp: document.getElementById('timestamp'),
    icon: document.getElementById('weatherIconImg'),
    forecast: document.getElementById('forecastList')
};


document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadFavorites();
    initCharts();
    fetchData(currentCity);
    
    
    startAutoRefresh();
});


dom.btn.addEventListener('click', () => handleSearch());
dom.input.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSearch() });
dom.refreshBtn.addEventListener('click', () => {
    fetchData(currentCity);
   
    startAutoRefresh(); 
});
dom.themeBtn.addEventListener('click', toggleTheme);
dom.unitBtn.addEventListener('click', toggleUnit);
dom.favBtn.addEventListener('click', toggleFavorite);


function handleSearch() {
    const city = dom.input.value.trim();
    if(city) fetchData(city);
}

function startAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
        console.log('Auto-refreshing...');
        fetchData(currentCity);
    }, 300000); 
}

async function fetchData(city) {
    dom.dashboard.classList.add('hidden');
    dom.loading.classList.remove('hidden');

    try {
        const res = await fetch(`be.php?city=${city}`);
        const result = await res.json();

        if(result.status === 'success') {
            currentCity = result.city;
            updateFavoriteBtnState();
            
            
            setTimeout(() => {
                renderUI(result.data);
                dom.loading.classList.add('hidden');
                dom.dashboard.classList.remove('hidden');
            }, 600);
        } else {
            alert(result.message);
            dom.loading.classList.add('hidden');
            dom.dashboard.classList.remove('hidden'); // Show old data if fail
        }
    } catch (err) {
        console.error(err);
        dom.loading.classList.add('hidden');
    }
}

function renderUI(data) {
    dom.cityName.innerText = currentCity.toUpperCase();
    dom.tempDisplay.innerText = formatTemp(data.current.temp);
    dom.desc.innerText = data.current.desc;
    
    const now = new Date();
    dom.timestamp.innerText = `Updated: ${now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`;

    dom.icon.src = getIconUrl(data.current.icon);

    updateCharts(data.current.temp, data.current.humidity, data.current.wind);

    dom.forecast.innerHTML = '';
    data.forecast.forEach(day => {
        const el = document.createElement('div');
        el.className = "flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition group";
        
        el.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${getIconUrl(day.icon)}" class="w-10 h-10 group-hover:scale-110 transition">
                <div>
                    <p class="font-bold text-lg leading-none">${day.day}</p>
                    <p class="text-xs opacity-60">Cuaca</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold text-xl">${formatTemp(day.max)}</p>
                <p class="text-sm opacity-60">${formatTemp(day.min)}</p>
            </div>
        `;
        dom.forecast.appendChild(el);
    });
}

function formatTemp(c) {
    if(isCelsius) return `${Math.round(c)}°C`;
    return `${Math.round(c * 9/5 + 32)}°F`;
}

function getIconUrl(keyword) {
    let code = '02d';
    if(keyword.includes('rain')) code = '10d';
    if(keyword.includes('storm')) code = '11d';
    if(keyword.includes('sun') || keyword.includes('clear')) code = '01d';
    if(keyword.includes('cloud')) code = '03d';
    return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function toggleUnit() {
    isCelsius = !isCelsius;
    dom.unitBtn.innerText = isCelsius ? '°C' : '°F';

    fetchData(currentCity); 
}


function loadFavorites() {
    const favs = JSON.parse(localStorage.getItem('weatherFavs')) || [];
    dom.favBar.innerHTML = '';
    favs.forEach(city => {
        const btn = document.createElement('button');
        btn.className = "px-4 py-2 rounded-full glass-panel text-sm hover:bg-white/20 whitespace-nowrap transition";
        btn.innerText = city;
        btn.onclick = () => fetchData(city);
        dom.favBar.appendChild(btn);
    });
}

function toggleFavorite() {
    let favs = JSON.parse(localStorage.getItem('weatherFavs')) || [];
    if(favs.includes(currentCity)) {
        favs = favs.filter(c => c !== currentCity); 
    } else {
        favs.push(currentCity); 
    }
    localStorage.setItem('weatherFavs', JSON.stringify(favs));
    updateFavoriteBtnState();
    loadFavorites();
}

function updateFavoriteBtnState() {
    const favs = JSON.parse(localStorage.getItem('weatherFavs')) || [];
    if(favs.includes(currentCity)) {
        dom.favBtn.classList.add('text-pink-500');
        dom.favBtn.innerHTML = '<i class="fas fa-heart"></i>'; 
    } else {
        dom.favBtn.classList.remove('text-pink-500');
        dom.favBtn.innerHTML = '<i class="far fa-heart"></i>'; 
    }
}

function toggleTheme() {
    isDark = !isDark;
    const html = document.documentElement;
    
    if(isDark) {
        html.classList.add('dark');
        dom.themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        html.classList.remove('dark');
        dom.themeBtn.innerHTML = '<i class="fas fa-moon text-slate-800"></i>';
    }
    
    updateChartTheme();
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    isDark = saved !== 'light'; 
    if(!isDark) {
        document.documentElement.classList.remove('dark');
        dom.themeBtn.innerHTML = '<i class="fas fa-moon text-slate-800"></i>';
    }

}

function initCharts() {
    const commonOpts = {
        chart: { type: 'radialBar', height: 250, fontFamily: 'Poppins' },
        plotOptions: {
            radialBar: {
                hollow: { size: '65%' },
                track: { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                dataLabels: {
                    name: { show: false },
                    value: { offsetY: 10, fontSize: '28px', fontWeight: '700', 
                             color: isDark ? '#fff' : '#334155' } 
                }
            }
        },
        stroke: { lineCap: 'round' }
    };

    charts.temp = new ApexCharts(document.querySelector("#chartTemp"), {
        ...commonOpts, series: [0], colors: ['#f59e0b'] 
    });
    charts.humid = new ApexCharts(document.querySelector("#chartHumid"), {
        ...commonOpts, series: [0], colors: ['#06b6d4'] 
    });
    charts.wind = new ApexCharts(document.querySelector("#chartWind"), {
        ...commonOpts, series: [0], colors: ['#10b981'] 
    });

    charts.temp.render();
    charts.humid.render();
    charts.wind.render();
}

function updateCharts(t, h, w) {
    const textColor = isDark ? '#fff' : '#1e293b';
    
    charts.temp.updateOptions({ 
        plotOptions: { radialBar: { dataLabels: { value: { color: textColor, formatter: () => formatTemp(t) } } } } 
    });
    charts.temp.updateSeries([Math.min((t/50)*100, 100)]);

    charts.humid.updateOptions({ 
        plotOptions: { radialBar: { dataLabels: { value: { color: textColor, formatter: () => `${h}%` } } } } 
    });
    charts.humid.updateSeries([h]);

    charts.wind.updateOptions({ 
        plotOptions: { radialBar: { dataLabels: { value: { color: textColor, formatter: () => `${w} km` } } } } 
    });
    charts.wind.updateSeries([Math.min(w*2, 100)]);
}

function updateChartTheme() {
    if(charts.temp) {
        const valTemp = parseFloat(dom.tempDisplay.innerText); 
        const textColor = isDark ? '#fff' : '#1e293b';
        const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        
        [charts.temp, charts.humid, charts.wind].forEach(c => {
            c.updateOptions({ 
                plotOptions: { radialBar: { track: { background: trackColor }, dataLabels: { value: { color: textColor } } } }
            });
        });
    }
}