// 全局变量存储所有比赛数据和图表实例
let allGameData = [];
let combinedPlayers = [];
let DATA_FILES = []; // 动态加载的文件列表

// 排序状态
let currentSort = {
    field: 'averageScore',
    order: 'desc'
};

// 扫描 data 目录获取所有 JSON 文件
async function scanDataDirectory() {
    // 第一优先级：尝试读取 data/index.json（推荐的目录索引方式）
    try {
        const indexResponse = await fetch('data/index.json');
        if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            DATA_FILES = indexData.files.map(f => f.filename) || [];
            console.log(`📋 从 data/index.json 加载 ${DATA_FILES.length} 个文件:`, DATA_FILES);
            
            if (DATA_FILES.length > 0) {
                return true;
            }
        }
    } catch (error) {
        console.log('ℹ️ 未找到 data/index.json，将尝试其他方式');
    }
    
    // 第二优先级：使用 file-list.json（兼容旧版本）
    try {
        const fileListResponse = await fetch('data/file-list.json');
        if (fileListResponse.ok) {
            const fileList = await fileListResponse.json();
            DATA_FILES = fileList.files || [];
            console.log(`📋 从 data/file-list.json 加载 ${DATA_FILES.length} 个文件:`, DATA_FILES);
            
            if (DATA_FILES.length > 0) {
                return true;
            }
        }
    } catch (error) {
        console.warn('⚠️ 读取 file-list.json 失败，将尝试自动扫描');
    }
    
    // 第三优先级：尝试自动扫描目录（仅部分本地服务器支持）
    try {
        const response = await fetch('data/');
        if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            DATA_FILES = Array.from(links)
                .map(link => link.getAttribute('href'))
                .filter(href => href && (href.endsWith('.json') || !href.includes('.')))
                .filter(href => !href.startsWith('.') && href !== '../' && href !== './');
            
            console.log(`📁 自动扫描到 ${DATA_FILES.length} 个数据文件:`, DATA_FILES);
            
            if (DATA_FILES.length > 0) {
                return true;
            }
        }
    } catch (error) {
        console.warn('⚠️ 无法自动扫描目录，服务器不支持目录列表功能');
    }
    
    // 最后的备用方案：使用硬编码的常见文件名
    DATA_FILES = [
        '0314.json',
        '0311_205642',
        '0311_200317'
    ];
    console.log('📝 使用默认文件列表:', DATA_FILES);
    return true;
}

// 加载所有比赛数据
async function loadAllGameData() {
    try {
        // 首先扫描 data 目录
        await scanDataDirectory();
        
        // 加载所有文件
        const loadingPromises = DATA_FILES.map(filename => {
            const filePath = filename.startsWith('data/') ? filename : `data/${filename}`;
            return loadJsonFile(filePath);
        });
        
        allGameData = await Promise.all(loadingPromises);
        
        // 过滤掉加载失败的数据
        allGameData = allGameData.filter(data => data !== null);
        
        if (allGameData.length === 0) {
            throw new Error('未能成功加载任何数据文件');
        }
        
        // 合并所有玩家数据
        combineAllPlayers();
        
        // 渲染页面
        renderPlayers(combinedPlayers);
        
        // 初始化选手选择器
        initializePlayerSelectors();
        
        // 初始化筛选按钮
        initializeFilterButtons();
        
        // 初始化表格排序
        initializeTableSort();
        
        console.log(`✅ 成功加载 ${allGameData.length} 场比赛数据`);
        console.log(`📊 共有 ${combinedPlayers.length} 名选手的数据`);
    } catch (error) {
        console.error('❌ 加载数据失败:', error);
        alert(`加载数据失败：${error.message}

请确保：
1. 在本地服务器环境下运行（如使用 http-server）
2. data 目录下存在 JSON 文件
3. 浏览器控制台查看详细错误`);
    }
}

// 加载单个 JSON 文件
async function loadJsonFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            console.warn(`⚠️ 无法加载文件：${filename}`);
            return null;
        }
        const data = await response.json();
        console.log(`✅ 已加载：${filename}`);
        return data;
    } catch (error) {
        console.warn(`⚠️ 文件 ${filename} 加载失败:`, error.message);
        return null;
    }
}

// 合并所有比赛数据中的玩家
function combineAllPlayers() {
    const playerMap = new Map();
    
    allGameData.forEach((game, gameIndex) => {
        if (!game || !game.data || !game.data.wgBattleDetailInfo) return;
        
        // 按位置分组同一场比赛的玩家
        const positionGroups = {};
        
        game.data.wgBattleDetailInfo.forEach(player => {
            const position = player.position;
            if (!positionGroups[position]) {
                positionGroups[position] = [];
            }
            positionGroups[position].push(player);
        });
        
        // 计算每个位置的对位差
        const matchupDiffs = {};
        Object.keys(positionGroups).forEach(position => {
            const players = positionGroups[position];
            if (players.length >= 2) {
                // 找到双方选手（teamId 100 vs 200）
                const team100Player = players.find(p => p.teamId === '100');
                const team200Player = players.find(p => p.teamId === '200');
                
                if (team100Player && team200Player) {
                    const goldDiff100 = team100Player.echartsMap.goldEarned - team200Player.echartsMap.goldEarned;
                    const levelDiff100 = parseInt(team100Player.dengji) - parseInt(team200Player.dengji);
                    const goldDiff200 = team200Player.echartsMap.goldEarned - team100Player.echartsMap.goldEarned;
                    const levelDiff200 = parseInt(team200Player.dengji) - parseInt(team100Player.dengji);
                    
                    matchupDiffs[`${team100Player.nickName}`] = { goldDiff: goldDiff100, levelDiff: levelDiff100 };
                    matchupDiffs[`${team200Player.nickName}`] = { goldDiff: goldDiff200, levelDiff: levelDiff200 };
                }
            }
        });
        
        game.data.wgBattleDetailInfo.forEach(player => {
            const playerId = player.nickName;
            
            if (!playerMap.has(playerId)) {
                // 新玩家，创建记录
                playerMap.set(playerId, {
                    nickName: playerId,
                    totalGames: 0,
                    totalWins: 0,
                    totalKills: 0,
                    totalDeaths: 0,
                    totalAssists: 0,
                    totalDamageDealt: 0,
                    totalDamageTaken: 0,
                    totalGoldEarned: 0,
                    totalScore: 0,
                    averageScore: 0,
                    averageKDA: 0,
                    winRate: 0,
                    positions: new Set(),
                    champions: new Set(),
                    gameHistory: [],
                    bestGame: null,
                    worstGame: null,
                    totalLevelDiff: 0,
                    totalGoldDiff: 0,
                    averageLevelDiff: 0,
                    averageGoldDiff: 0
                });
            }
            
            const playerStats = playerMap.get(playerId);
            
            // 累加数据
            playerStats.totalGames++;
            if (player.win === 'Win') {
                playerStats.totalWins++;
            }
            
            // 解析 KDA
            const kills = parseInt(player.scoreInfo.split('/')[0]);
            const deaths = parseInt(player.scoreInfo.split('/')[1]);
            const assists = parseInt(player.scoreInfo.split('/')[2]);
            
            playerStats.totalKills += kills;
            playerStats.totalDeaths += deaths;
            playerStats.totalAssists += assists;
            playerStats.totalDamageDealt += player.echartsMap.totalDamageDealt;
            playerStats.totalDamageTaken += player.echartsMap.totalDamageTaken;
            playerStats.totalGoldEarned += player.echartsMap.goldEarned;
            playerStats.totalScore += player.scoreInfoNum;
            
            // 累加对位差
            if (matchupDiffs[playerId]) {
                playerStats.totalGoldDiff += matchupDiffs[playerId].goldDiff;
                playerStats.totalLevelDiff += matchupDiffs[playerId].levelDiff;
            }
            
            // 记录位置和使用过的英雄
            playerStats.positions.add(player.position);
            playerStats.champions.add(player.detailChampionId);
            
            // 计算 KDA
            const kda = ((kills + assists) / Math.max(deaths, 1)).toFixed(2);
            
            // 记录每场比赛详情
            playerStats.gameHistory.push({
                gameIndex: gameIndex + 1,
                kills: kills,
                deaths: deaths,
                assists: assists,
                kda: parseFloat(kda),
                score: player.scoreInfoNum,
                win: player.win,
                position: player.position,
                championId: player.detailChampionId,
                damage: player.echartsMap.totalDamageDealt,
                gold: player.echartsMap.goldEarned
            });
            
            // 更新最佳/最差比赛
            if (!playerStats.bestGame || player.scoreInfoNum > playerStats.bestGame.score) {
                playerStats.bestGame = {
                    gameIndex: gameIndex + 1,
                    score: player.scoreInfoNum,
                    kda: parseFloat(kda),
                    scoreInfo: player.scoreInfo
                };
            }
            if (!playerStats.worstGame || player.scoreInfoNum < playerStats.worstGame.score) {
                playerStats.worstGame = {
                    gameIndex: gameIndex + 1,
                    score: player.scoreInfoNum,
                    kda: parseFloat(kda),
                    scoreInfo: player.scoreInfo
                };
            }
        });
    });
    
    // 计算平均值和胜率
    playerMap.forEach((stats, playerId) => {
        stats.averageScore = (stats.totalScore / stats.totalGames).toFixed(2);
        stats.averageKDA = ((stats.totalKills + stats.totalAssists) / Math.max(stats.totalDeaths, 1)).toFixed(2);
        stats.winRate = ((stats.totalWins / stats.totalGames) * 100).toFixed(1);
        stats.positions = Array.from(stats.positions);
        stats.champions = Array.from(stats.champions);
        
        // 计算场均数据
        stats.averageKills = (stats.totalKills / stats.totalGames).toFixed(2);
        stats.averageDeaths = (stats.totalDeaths / stats.totalGames).toFixed(2);
        stats.averageAssists = (stats.totalAssists / stats.totalGames).toFixed(2);
        stats.averageDamage = (stats.totalDamageDealt / stats.totalGames).toFixed(2);
        stats.averageGold = (stats.totalGoldEarned / stats.totalGames).toFixed(2);
        
        // 计算对位差平均值
        stats.averageGoldDiff = (stats.totalGoldDiff / stats.totalGames).toFixed(2);
        stats.averageLevelDiff = (stats.totalLevelDiff / stats.totalGames).toFixed(2);
    });
    
    // 转换为数组并排序（按平均评分）
    combinedPlayers = Array.from(playerMap.values()).sort((a, b) => 
        parseFloat(b.averageScore) - parseFloat(a.averageScore)
    );
}

// 渲染选手卡片
function renderPlayers(players) {
    const playersTableBody = document.getElementById('playersTableBody');
    
    // 排序
    const sortedPlayers = [...players].sort((a, b) => {
        let aVal = a[currentSort.field];
        let bVal = b[currentSort.field];
        
        // 处理数值转换
        if (currentSort.field === 'positions') {
            aVal = Array.isArray(a.positions) ? a.positions.join('/') : '';
            bVal = Array.isArray(b.positions) ? b.positions.join('/') : '';
        } else if (['totalGames', 'averageScore', 'averageKDA', 'averageKills', 'averageDeaths', 'averageAssists', 'winRate', 'averageGoldDiff', 'averageLevelDiff'].includes(currentSort.field)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        // 比较
        if (aVal < bVal) return currentSort.order === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });
    
    playersTableBody.innerHTML = '';
    
    sortedPlayers.forEach(player => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${player.nickName.split('#')[0]}</td>
            <td>${player.totalGames}</td>
            <td>${player.positions.join('/')}</td>
            <td style="color: ${parseFloat(player.winRate) >= 50 ? '#28a745' : '#dc3545'}; font-weight: bold;">${player.winRate}%</td>
            <td style="font-weight: bold; color: #667eea;">${player.averageScore}</td>
            <td>${player.averageKDA}</td>
            <td>${player.averageKills}</td>
            <td>${player.averageDeaths}</td>
            <td>${player.averageAssists}</td>
            <td style="color: ${parseFloat(player.averageGoldDiff) >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">
                ${parseFloat(player.averageGoldDiff) >= 0 ? '+' : ''}${(parseFloat(player.averageGoldDiff) / 1000).toFixed(1)}k
            </td>
            <td style="color: ${parseFloat(player.averageLevelDiff) >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">
                ${parseFloat(player.averageLevelDiff) >= 0 ? '+' : ''}${player.averageLevelDiff}
            </td>
        `;
        
        playersTableBody.appendChild(row);
    });
}

// 更新选择器选项（当筛选时）
function initializePlayerSelectors() {
    const player1Select = document.getElementById('player1Select');
    const player2Select = document.getElementById('player2Select');
    
    // 清空选项
    player1Select.innerHTML = '';
    player2Select.innerHTML = '';
    
    // 添加选项
    combinedPlayers.forEach((player, index) => {
        const playerName = player.nickName.split('#')[0];
        const option1 = new Option(playerName, index);
        const option2 = new Option(playerName, index);
        
        player1Select.add(option1);
        player2Select.add(option2);
    });
    
    // 默认选择前两名选手
    if (combinedPlayers.length >= 2) {
        player1Select.selectedIndex = 0;
        player2Select.selectedIndex = 1;
    }
    
    // 监听变化
    player1Select.addEventListener('change', () => {
        updateComparisonCharts();
    });
    
    player2Select.addEventListener('change', () => {
        updateComparisonCharts();
    });
    
    // 创建初始对比图表
    updateComparisonCharts();
}

// 初始化表格排序功能
function initializeTableSort() {
    const headers = document.querySelectorAll('.players-table th[data-sort]');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const field = header.getAttribute('data-sort');
            
            // 切换排序方向
            if (currentSort.field === field) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.order = 'desc'; // 默认降序
            }
            
            // 更新所有表头的箭头
            headers.forEach(h => {
                const hField = h.getAttribute('data-sort');
                if (hField === currentSort.field) {
                    h.textContent = h.textContent.replace(/ ⬍$/, '').replace(/ ⬆$/, '').replace(/ ⬇$/, '') + 
                        (currentSort.order === 'asc' ? ' ⬆' : ' ⬇');
                } else {
                    h.textContent = h.textContent.replace(/ ⬍$/, '').replace(/ ⬆$/, '').replace(/ ⬇$/, '') + ' ⬍';
                }
            });
            
            // 重新渲染表格
            renderPlayers(combinedPlayers);
        });
    });
}

// 初始化筛选按钮
function initializeFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的 active 类
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // 添加当前按钮的 active 类
            button.classList.add('active');
            
            // 获取选中的位置
            const position = button.getAttribute('data-position');
            
            // 筛选选手
            filterPlayersByPosition(position);
        });
    });
}

// 根据位置筛选选手
function filterPlayersByPosition(position) {
    let filtered = combinedPlayers;
    
    if (position !== 'all') {
        filtered = filtered.filter(p => p.positions.includes(position));
    }
    
    // 重置排序为默认（评分降序）
    currentSort.field = 'averageScore';
    currentSort.order = 'desc';
    
    // 更新表头箭头显示
    const headers = document.querySelectorAll('.players-table th[data-sort]');
    headers.forEach(h => {
        const hField = h.getAttribute('data-sort');
        if (hField === 'averageScore') {
            h.textContent = h.textContent.replace(/ ⬍$/, '').replace(/ ⬆$/, '').replace(/ ⬇$/, '') + ' ⬇';
        } else {
            h.textContent = h.textContent.replace(/ ⬍$/, '').replace(/ ⬆$/, '').replace(/ ⬇$/, '') + ' ⬍';
        }
    });
    
    renderPlayers(filtered);
    updatePlayerSelectors(filtered);
}

// 更新选择器选项（当筛选时）
function updatePlayerSelectors(filteredPlayers) {
    const player1Select = document.getElementById('player1Select');
    const player2Select = document.getElementById('player2Select');
    
    // 保存当前选择
    const selected1 = player1Select.value;
    const selected2 = player2Select.value;
    
    // 清空选项
    player1Select.innerHTML = '';
    player2Select.innerHTML = '';
    
    // 添加选项
    filteredPlayers.forEach((player, index) => {
        const playerName = player.nickName.split('#')[0];
        const option1 = new Option(playerName, index);
        const option2 = new Option(playerName, index);
        
        player1Select.add(option1);
        player2Select.add(option2);
    });
    
    // 尝试恢复选择，如果之前的索引无效则选择默认值
    player1Select.selectedIndex = selected1 < filteredPlayers.length ? selected1 : 0;
    player2Select.selectedIndex = selected2 < filteredPlayers.length && selected2 !== selected1 ? selected2 : (selected1 === '0' ? '1' : '0');
    
    // 更新图表
    updateComparisonCharts();
}

// 更新对比图表
function updateComparisonCharts() {
    const player1Index = document.getElementById('player1Select').value;
    const player2Index = document.getElementById('player2Select').value;
    
    const player1 = combinedPlayers[player1Index];
    const player2 = combinedPlayers[player2Index];
    
    // 更新选手名称显示
    document.getElementById('player1Name').textContent = player1.nickName.split('#')[0];
    document.getElementById('player2Name').textContent = player2.nickName.split('#')[0];
    
    // 更新各项数据的横向条形图
    updateBarComparison('Kda', parseFloat(player1.averageKDA), parseFloat(player2.averageKDA));
    updateBarComparison('Kills', parseFloat(player1.averageKills), parseFloat(player2.averageKills));
    updateBarComparison('Deaths', parseFloat(player1.averageDeaths), parseFloat(player2.averageDeaths));
    updateBarComparison('Assists', parseFloat(player1.averageAssists), parseFloat(player2.averageAssists));
    updateBarComparison('GoldDiff', parseFloat(player1.averageGoldDiff), parseFloat(player2.averageGoldDiff));
    updateBarComparison('LevelDiff', parseFloat(player1.averageLevelDiff), parseFloat(player2.averageLevelDiff));
    updateBarComparison('Score', parseFloat(player1.averageScore), parseFloat(player2.averageScore));
}

// 更新单个对比条
function updateBarComparison(metric, value1, value2) {
    const total = Math.abs(value1) + Math.abs(value2);
    const percentage1 = total > 0 ? (Math.abs(value1) / total) * 100 : 50;
    const percentage2 = total > 0 ? (Math.abs(value2) / total) * 100 : 50;
    
    // 格式化显示值
    let displayValue1, displayValue2;
    if (metric === 'GoldDiff') {
        // 对位经济差：除以 1000 并添加 k 后缀
        displayValue1 = (value1 / 1000).toFixed(1) + 'k';
        displayValue2 = (value2 / 1000).toFixed(1) + 'k';
    } else if (metric === 'LevelDiff') {
        // 对位等级差：保留 2 位小数
        displayValue1 = value1.toFixed(2);
        displayValue2 = value2.toFixed(2);
    } else if (metric === 'Damage' || metric === 'Gold') {
        displayValue1 = (value1 / 1000).toFixed(1) + 'k';
        displayValue2 = (value2 / 1000).toFixed(1) + 'k';
    } else {
        displayValue1 = value1.toFixed(2);
        displayValue2 = value2.toFixed(2);
    }
    
    // 更新条形图
    const p1Bar = document.getElementById(`p1${metric}Bar`);
    const p2Bar = document.getElementById(`p2${metric}Bar`);
    
    if (p1Bar && p2Bar) {
        p1Bar.style.width = `${percentage1}%`;
        p2Bar.style.width = `${percentage2}%`;
        
        // 更新数值显示
        document.getElementById(`p1${metric}Value`).textContent = displayValue1;
        document.getElementById(`p2${metric}Value`).textContent = displayValue2;
    }
}


