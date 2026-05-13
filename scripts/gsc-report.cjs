#!/usr/bin/env node
const { google } = require('googleapis');
const path = require('path');

// GCP 服务账号密钥路径
const KEY_PATH = path.join(__dirname, '../credentials/gcp-service-account.json');

// 站点列表 - 注意格式!
const SITES = [
  'sc-domain:tools.sagasu.art',   // 域名资源用 sc-domain: 前缀
  'sc-domain:slitherlinks.com',   // 域名资源用 sc-domain: 前缀
  // 'https://example.com/',      // URL 前缀资源用完整 URL(含尾斜杠)
];

/**
 * 获取日期范围
 * 默认查询最近28天
 */
function getDateRange(days = 28) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * 格式化数字
 */
function formatNumber(num) {
  return num ? num.toLocaleString() : '0';
}

/**
 * 格式化 CTR
 */
function formatCTR(ctr) {
  return ctr ? (ctr * 100).toFixed(1) + '%' : '0%';
}

/**
 * 格式化排名
 */
function formatPosition(pos) {
  return pos ? pos.toFixed(1) : '-';
}

/**
 * 查询站点数据
 */
async function querySite(searchconsole, siteUrl, keywordFilter = null) {
  const { startDate, endDate } = getDateRange();
  
  console.log(`\n=== ${siteUrl} (${startDate} ~ ${endDate}) ===`);
  
  try {
    // 构建查询请求
    const requestBody = {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 20,
    };
    
    // 如果有关键词过滤，添加维度过滤器
    if (keywordFilter) {
      requestBody.dimensionFilterGroups = [{
        filters: [{
          dimension: 'query',
          operator: 'contains',
          expression: keywordFilter
        }]
      }];
    }
    
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody
    });
    
    const rows = res.data.rows || [];
    
    if (rows.length === 0) {
      console.log('暂无数据');
      return;
    }
    
    // 计算总计
    let totalClicks = 0;
    let totalImpressions = 0;
    let weightedPositionSum = 0;
    
    rows.forEach(row => {
      totalClicks += parseInt(row.clicks || 0);
      totalImpressions += parseInt(row.impressions || 0);
      weightedPositionSum += (row.position || 0) * (row.impressions || 0);
    });
    
    const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgPosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0;
    
    // 输出汇总
    console.log(`总点击: ${formatNumber(totalClicks)} | 总展示: ${formatNumber(totalImpressions)} | 平均CTR: ${formatCTR(avgCTR)} | 平均排名: ${formatPosition(avgPosition)}`);
    
    // 输出 Top 关键词
    console.log('\nTop 关键词:');
    rows.forEach((row, index) => {
      const query = row.keys[0];
      const clicks = parseInt(row.clicks || 0);
      const impressions = parseInt(row.impressions || 0);
      const ctr = row.ctr || 0;
      const position = row.position || 0;
      
      console.log(`${index + 1}. ${query} | ${formatNumber(clicks)} | ${formatNumber(impressions)} | ${formatCTR(ctr)} | ${formatPosition(position)}`);
    });
    
  } catch (error) {
    console.error(`查询失败: ${error.message}`);
    if (error.message.includes('403')) {
      console.error('提示: 请检查站点 URL 格式是否正确（sc-domain: 或 https://）以及服务账号是否有权限访问该站点');
    }
  }
}

/**
 * 列出所有已授权的站点
 */
async function listSites(searchconsole) {
  console.log('\n=== 已授权的站点列表 ===');
  
  try {
    const res = await searchconsole.sites.list();
    const sites = res.data.siteEntry || [];
    
    if (sites.length === 0) {
      console.log('没有找到已授权的站点');
      return;
    }
    
    sites.forEach((site, index) => {
      console.log(`${index + 1}. ${site.siteUrl} (${site.permissionLevel})`);
    });
    
  } catch (error) {
    console.error(`获取站点列表失败: ${error.message}`);
  }
}

/**
 * 主函数
 */
async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const siteFilter = args[0];      // 可选：站点过滤（如 "slitherlinks"）
  const keywordFilter = args[1];   // 可选：关键词过滤
  
  // 初始化认证
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  
  const searchconsole = google.searchconsole({
    version: 'v1',
    auth
  });
  
  // 如果没有参数，显示帮助
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
用法:
  node gsc-report.cjs                    # 查询所有配置的站点
  node gsc-report.cjs <site>             # 只查询包含指定字符串的站点
  node gsc-report.cjs <site> <keyword>   # 查询特定站点的特定关键词
  node gsc-report.cjs --list             # 列出所有已授权的站点

示例:
  node gsc-report.cjs                    # 查所有站点
  node gsc-report.cjs slitherlinks       # 只查 slitherlinks 站点
  node gsc-report.cjs slitherlinks puzzle # 查 slitherlinks 站点中包含 "puzzle" 的关键词
  node gsc-report.cjs --list             # 列出所有站点
    `);
    return;
  }
  
  // 列出所有站点
  if (args.includes('--list') || args.includes('-l')) {
    await listSites(searchconsole);
    return;
  }
  
  // 过滤要查询的站点
  let sitesToQuery = SITES;
  if (siteFilter) {
    sitesToQuery = SITES.filter(site => site.toLowerCase().includes(siteFilter.toLowerCase()));
    if (sitesToQuery.length === 0) {
      console.error(`未找到匹配 "${siteFilter}" 的站点`);
      console.log(`\n配置的站点列表:`);
      SITES.forEach(site => console.log(`  - ${site}`));
      return;
    }
  }
  
  // 查询每个站点
  for (const siteUrl of sitesToQuery) {
    await querySite(searchconsole, siteUrl, keywordFilter);
  }
}

main().catch(console.error);
