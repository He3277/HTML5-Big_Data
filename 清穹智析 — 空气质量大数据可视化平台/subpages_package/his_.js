// 全局变量：当前年份、当前指标、对比城市列表
let currentYear = 2023; // 初始年份，和你现有滑块保持一致
let currentIndicator = "AQI";
let compareCities = [];

// 模拟数据（你可替换为真实接口数据）
const mockCityData = [
  { city: "北京", province: "北京", region: "华北", 2020: { AQI: 78, "PM2.5": 42, "good_days": 282 }, 2021: { AQI: 75, "PM2.5": 39, "good_days": 290 }, 2022: { AQI: 72, "PM2.5": 36, "good_days": 298 }, 2023: { AQI: 69, "PM2.5": 33, "good_days": 305 } },
  { city: "上海", province: "上海", region: "华东", 2020: { AQI: 65, "PM2.5": 35, "good_days": 300 }, 2021: { AQI: 62, "PM2.5": 32, "good_days": 308 }, 2022: { AQI: 60, "PM2.5": 30, "good_days": 315 }, 2023: { AQI: 58, "PM2.5": 28, "good_days": 320 } },
  { city: "广州", province: "广东", region: "华南", 2020: { AQI: 68, "PM2.5": 38, "good_days": 295 }, 2021: { AQI: 66, "PM2.5": 36, "good_days": 300 }, 2022: { AQI: 64, "PM2.5": 34, "good_days": 305 }, 2023: { AQI: 62, "PM2.5": 32, "good_days": 310 } },
  { city: "成都", province: "四川", region: "西南", 2020: { AQI: 72, "PM2.5": 40, "good_days": 285 }, 2021: { AQI: 70, "PM2.5": 38, "good_days": 292 }, 2022: { AQI: 68, "PM2.5": 36, "good_days": 298 }, 2023: { AQI: 66, "PM2.5": 34, "good_days": 302 } },
  // 可补充更多城市数据
];

// 1. 初始化ECharts实例
const mapChart = echarts.init(document.getElementById('china-map'));
const rankingChart = echarts.init(document.getElementById('city-ranking'));
const distributionChart = echarts.init(document.getElementById('national-distribution'));
const compareRadarChart = echarts.init(document.getElementById('city-compare-radar'));

// 2. 核心函数：根据年份/指标更新所有图表
function updateAllCharts() {
  updateMap();
  updateRanking();
  updateDistribution();
  updateCompareRadar();
  updateDataTable();
  // 联动你现有图表：调用你现有setYear/setIndicator函数
  // setYear(currentYear); 
  // setIndicator(currentIndicator);
}

// 3. 初始化地图
function updateMap() {
  // 处理地图数据：按省份聚合
  const provinceData = {};
  mockCityData.forEach(city => {
    if (!provinceData[city.province]) {
      provinceData[city.province] = { value: city[currentYear][currentIndicator], cities: [] };
    }
    provinceData[city.province].cities.push(city);
  });
  
  const mapOption = {
    backgroundColor: '#fff',
    title: { text: `${currentYear}年全国${currentIndicator}分布`, left: 'center' },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.data.cities) {
          return `${params.name}<br/>${currentIndicator}均值：${params.data.value}<br/>点击查看下辖城市`;
        }
        return `${params.name}<br/>${currentIndicator}：${params.data.value}`;
      }
    },
    visualMap: {
      min: Math.min(...mockCityData.map(c => c[currentYear][currentIndicator])),
      max: Math.max(...mockCityData.map(c => c[currentYear][currentIndicator])),
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#e0f7fa', '#4dd0e1', '#0097a7', '#006064']
      }
    },
    series: [
      {
        name: currentIndicator,
        type: 'map',
        mapType: 'china',
        roam: true,
        label: { show: true },
        data: Object.keys(provinceData).map(prov => ({
          name: prov,
          value: provinceData[prov].value,
          cities: provinceData[prov].cities
        }))
      }
    ]
  };
  mapChart.setOption(mapOption);
  
  // 地图点击事件：下钻城市/返回
  mapChart.on('click', (params) => {
    if (params.data.cities) {
      // 展示该省份的城市级地图（简化版：直接高亮城市卡片/对比）
      const city = params.data.cities[0];
      addToCompare(city.city); // 示例：加入对比
      // 联动你现有城市卡片：调用addCityCard
      // addCityCard(city.city, currentYear);
    }
  });
}

// 4. 初始化榜单（Top10/Bottom10）
function updateRanking() {
  // 排序数据
  const sortedData = [...mockCityData].sort((a, b) => b[currentYear][currentIndicator] - a[currentYear][currentIndicator]);
  const top10 = sortedData.slice(0, 10);
  const bottom10 = sortedData.slice(-10).reverse();
  
  const rankingOption = {
    title: { text: `${currentYear}年${currentIndicator} Top10`, left: 'center', fontSize: 14 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    yAxis: { 
      type: 'category', 
      data: top10.map(c => c.city),
      axisLabel: { fontSize: 10 }
    },
    series: [{
      name: currentIndicator,
      type: 'bar',
      data: top10.map(c => c[currentYear][currentIndicator]),
      itemStyle: { color: '#ff7f50' }
    }]
  };
  rankingChart.setOption(rankingOption);
  
  // 榜单点击事件：加入对比
  rankingChart.on('click', (params) => {
    addToCompare(params.name);
  });
}

// 5. 初始化分布图表（箱线图）
function updateDistribution() {
  const values = mockCityData.map(c => c[currentYear][currentIndicator]);
  const distributionOption = {
    title: { text: `${currentYear}年${currentIndicator}全国分布`, left: 'center', fontSize: 14 },
    tooltip: { trigger: 'item' },
    grid: { left: '10%', right: '5%', bottom: '10%', top: '15%' },
    xAxis: { type: 'category', data: [currentIndicator] },
    yAxis: { type: 'value' },
    series: [{
      name: '全国分布',
      type: 'boxplot',
      data: [[Math.min(...values), values.sort((a,b)=>a-b)[Math.floor(values.length*0.25)], values.sort((a,b)=>a-b)[Math.floor(values.length*0.5)], values.sort((a,b)=>a-b)[Math.floor(values.length*0.75)], Math.max(...values)]]
    }]
  };
  distributionChart.setOption(distributionOption);
  
  // 箱线图刷选：筛选地图/榜单
  distributionChart.on('brushSelected', (params) => {
    const [min, max] = params.batch[0].range[1];
    const filteredCities = mockCityData.filter(c => c[currentYear][currentIndicator] >= min && c[currentYear][currentIndicator] <= max);
    // 更新地图/榜单为筛选后数据（可扩展）
    console.log('筛选后城市：', filteredCities.map(c => c.city));
  });
}

// 6. 初始化对比雷达图
function updateCompareRadar() {
  if (compareCities.length === 0) {
    compareRadarChart.setOption({
      title: { text: '请选择城市进行对比', left: 'center' },
      series: []
    });
    return;
  }
  
  // 提取对比指标
  const indicators = ['AQI', 'PM2.5', 'good_days'];
  const radarOption = {
    title: { text: `城市多指标对比（${currentYear}）`, left: 'center' },
    tooltip: { trigger: 'item' },
    radar: {
      indicator: indicators.map(ind => ({ name: ind, max: Math.max(...mockCityData.map(c => c[currentYear][ind])) }))
    },
    series: compareCities.map((cityName, idx) => {
      const city = mockCityData.find(c => c.city === cityName);
      return {
        name: cityName,
        type: 'radar',
        data: [{
          value: indicators.map(ind => city[currentYear][ind]),
          name: cityName
        }],
        itemStyle: { color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'][idx] }
      };
    })
  };
  compareRadarChart.setOption(radarOption);
}

// 7. 初始化明细表格
function updateDataTable() {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';
  
  // 筛选区域数据
  const filteredData = mockCityData.filter(c => {
    if (document.getElementById('region-select').value === 'nation') return true;
    return c.region === document.getElementById('region-select').value;
  });
  
  // 搜索过滤
  const searchKey = document.getElementById('city-search').value.trim().toLowerCase();
  const finalData = searchKey ? filteredData.filter(c => c.city.toLowerCase().includes(searchKey)) : filteredData;
  
  finalData.forEach(city => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${city.city}</td>
      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${city.province}</td>
      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${currentYear}</td>
      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${city[currentYear].AQI}</td>
      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${city[currentYear]["PM2.5"]}</td>
      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${city[currentYear].good_days}</td>
      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
        <button onclick="addToCompare('${city.city}')" class="text-blue-500 hover:text-blue-700">加入对比</button>
      </td>
    `;
    // 表格行点击：联动地图/现有卡片
    tr.addEventListener('click', () => {
      // 定位地图到该城市（简化版：直接加入对比）
      addToCompare(city.city);
      // 联动现有城市卡片
      // addCityCard(city.city, currentYear);
    });
    tableBody.appendChild(tr);
  });
}

// 8. 辅助函数：加入对比
function addToCompare(cityName) {
  if (!compareCities.includes(cityName) && compareCities.length < 6) {
    compareCities.push(cityName);
    // 更新对比列表
    const compareList = document.getElementById('compare-compare-list');
    const tag = document.createElement('span');
    tag.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
    tag.innerHTML = `${cityName} <button onclick="removeFromCompare('${cityName}')" class="ml-1 text-blue-600">&times;</button>`;
    document.getElementById('compare-city-list').appendChild(tag);
    updateCompareRadar();
  }
}

// 9. 辅助函数：移除对比
function removeFromCompare(cityName) {
  compareCities = compareCities.filter(c => c !== cityName);
  document.querySelectorAll('#compare-city-list span').forEach(tag => {
    if (tag.innerText.includes(cityName)) tag.remove();
  });
  updateCompareRadar();
}

// 10. 绑定事件监听
// 年份滑块联动（替换为你现有年份滑块的事件）
// document.getElementById('year-slider').addEventListener('input', (e) => {
//   currentYear = parseInt(e.target.value);
//   updateAllCharts();
// });

// 指标切换
document.getElementById('indicator-select').addEventListener('change', (e) => {
  currentIndicator = e.target.value;
  updateAllCharts();
});

// 区域切换
document.getElementById('region-select').addEventListener('change', () => {
  updateAllCharts();
});

// 清空对比
document.getElementById('clear-compare-btn').addEventListener('click', () => {
  compareCities = [];
  document.getElementById('compare-city-list').innerHTML = '';
  updateCompareRadar();
});

// 搜索城市
document.getElementById('city-search').addEventListener('input', () => {
  updateDataTable();
});

// 导出表格（简化版，可引入SheetJS实现真实导出）
document.getElementById('export-table-btn').addEventListener('click', () => {
  alert('导出功能：可引入SheetJS库实现Excel导出，当前为模拟');
});

// 初始化所有图表
updateAllCharts();

// 自适应窗口大小
window.addEventListener('resize', () => {
  mapChart.resize();
  rankingChart.resize();
  distributionChart.resize();
  compareRadarChart.resize();
});