/**
 * 数据导出工具
 * 支持导出学习数据为 CSV 和 JSON 格式
 */

/**
 * 导出词汇数据为 CSV
 * @param {Array} vocabulary - 词汇列表
 * @param {string} filename - 文件名
 */
export function exportToCSV(vocabulary, filename = 'vocabulary_export') {
    // CSV 头部
    const headers = ['单词', '释义', '音标', '掌握度', '复习次数', '添加时间', '下次复习']

    // 生成 CSV 内容
    const rows = vocabulary.map(word => [
        word.headWord || '',
        (word.definition || '').replace(/"/g, '""'), // 转义引号
        word.pronunciation || '',
        `${word.mastery_level || 0}%`,
        word.reviewCount || 0,
        word.createdAt ? new Date(word.createdAt).toLocaleDateString('zh-CN') : '',
        word.nextReviewDate ? new Date(word.nextReviewDate).toLocaleDateString('zh-CN') : ''
    ])

    // 组装 CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // 添加 BOM 以支持 Excel 正确显示中文
    const BOM = '\uFEFF'
    downloadFile(BOM + csvContent, `${filename}.csv`, 'text/csv;charset=utf-8')
}

/**
 * 导出词汇数据为 JSON
 * @param {Array} vocabulary - 词汇列表
 * @param {string} filename - 文件名
 */
export function exportToJSON(vocabulary, filename = 'vocabulary_export') {
    const exportData = {
        exportDate: new Date().toISOString(),
        totalWords: vocabulary.length,
        vocabulary: vocabulary.map(word => ({
            headWord: word.headWord,
            definition: word.definition,
            pronunciation: word.pronunciation,
            mastery_level: word.mastery_level || 0,
            reviewCount: word.reviewCount || 0,
            createdAt: word.createdAt,
            nextReviewDate: word.nextReviewDate,
            sentences: word.sentences || []
        }))
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    downloadFile(jsonContent, `${filename}.json`, 'application/json')
}

/**
 * 导出学习统计报告
 * @param {object} stats - 统计数据
 * @param {Array} vocabulary - 词汇列表
 * @param {string} filename - 文件名
 */
export function exportReport(stats, vocabulary, filename = 'learning_report') {
    const now = new Date()

    // 生成报告内容
    const report = `
# 学习报告
生成时间：${now.toLocaleString('zh-CN')}

## 总体统计
- 总词汇量：${stats.totalWords} 个
- 已掌握：${stats.masteredWords} 个
- 平均掌握度：${stats.avgMastery}%
- 总复习次数：${stats.totalReviews} 次

## 掌握程度分布
${stats.distribution ? stats.distribution.map(d => `- ${d.label}: ${d.count} 个 (${d.percent}%)`).join('\n') : '无数据'}

## 最近添加的单词
${vocabulary.slice(0, 10).map((w, i) => `${i + 1}. ${w.headWord} - ${w.definition}`).join('\n')}

---
由词汇本应用自动生成
`

    downloadFile(report, `${filename}.md`, 'text/markdown')
}

/**
 * 下载文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}

/**
 * 获取导出文件名（带时间戳）
 * @param {string} prefix - 前缀
 * @returns {string} 文件名
 */
export function getExportFilename(prefix = 'vocab') {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    return `${prefix}_${dateStr}`
}
