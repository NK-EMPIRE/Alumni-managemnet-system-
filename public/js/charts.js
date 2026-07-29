/**
 * Alumni Professional Details Update Management System
 * Chart Initialization Functions (charts.js)
 * 
 * This file contains Chart.js chart initialization functions with professional
 * styling, gradient fills, responsive options, and realistic dummy data.
 * Charts are created using Chart.js loaded from CDN.
 */

(function () {
    'use strict';

    // =========================================================================
    // GLOBAL CHART.JS CONFIGURATION
    // =========================================================================

    var PRIMARY_COLOR = '#2563EB';
    var PRIMARY_LIGHT = '#93C5FD';
    var PRIMARY_DARK = '#1D4ED8';
    var SUCCESS_COLOR = '#10B981';
    var WARNING_COLOR = '#F59E0B';
    var ERROR_COLOR = '#EF4444';
    var TEXT_COLOR = '#6B7280';
    var GRID_COLOR = '#E5E7EB';
    var BG_COLOR = '#FFFFFF';

    var chartColors = [
        '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'
    ];

    /**
     * Register the global default font family for all Chart.js charts.
     */
    function setGlobalChartDefaults() {
        if (typeof Chart === 'undefined') return;

        var isDark = document.body.classList.contains('dark-mode');
        TEXT_COLOR = isDark ? '#F8FAFC' : '#64748B';
        GRID_COLOR = isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB';

        Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        Chart.defaults.color = TEXT_COLOR;
        if (Chart.defaults.font) Chart.defaults.font.color = TEXT_COLOR;
        if (Chart.defaults.scale && Chart.defaults.scale.ticks) Chart.defaults.scale.ticks.color = TEXT_COLOR;
        if (Chart.defaults.scale && Chart.defaults.scale.grid) Chart.defaults.scale.grid.color = GRID_COLOR;
        if (Chart.defaults.plugins && Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels) {
            Chart.defaults.plugins.legend.labels.color = TEXT_COLOR;
            Chart.defaults.plugins.legend.labels.usePointStyle = true;
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('themeChanged', function () {
            setGlobalChartDefaults();
        });
    }

    /**
     * Create a vertical linear gradient for a chart context.
     * @param {CanvasRenderingContext2D} ctx - Canvas context.
     * @param {string} color1 - Top color.
     * @param {string} color2 - Bottom color (defaults to transparent).
     * @returns {CanvasGradient} The gradient object.
     */
    function createGradient(ctx, color1, color2) {
        if (!color2) color2 = 'rgba(37, 99, 235, 0.05)';
        var gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height * 0.8);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    }

    /**
     * Safely destroy a previous Chart instance on a canvas to prevent memory leaks.
     * @param {string} canvasId - The canvas element ID.
     */
    function destroyChart(canvasId) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Chart.js stores the instance on the canvas element
        var existing = Chart.getChart(canvasId);
        if (existing) {
            existing.destroy();
        }
    }

    /**
     * Wait for Chart.js to be available, then execute callback.
     * @param {Function} callback - Function to run once Chart is defined.
     * @param {number} [retries=20] - Max retries.
     */
    function waitForChartJS(callback, retries) {
        if (!retries) retries = 20;

        if (typeof Chart !== 'undefined') {
            setGlobalChartDefaults();
            callback();
            return;
        }

        if (retries <= 0) {
            console.warn('[AlumniApp Charts] Chart.js library not loaded.');
            return;
        }

        setTimeout(function () {
            waitForChartJS(callback, retries - 1);
        }, 250);
    }

    // =========================================================================
    // 1. DOUGHNUT / PIE CHART (OVERALL COMPLETION)
    // =========================================================================

    /**
     * Create a doughnut chart for overall completion status.
     * Dummy data: 65% Completed, 20% In Progress, 15% Pending.
     * @param {string} canvasId - The canvas element ID.
     * @param {Object} [customData] - Optional custom data { labels, values, colors }.
     * @returns {Chart|null} Chart.js instance or null on failure.
     */
    function createDoughnutChart(canvasId, customData) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        destroyChart(canvasId);

        var data = customData || {
            labels: ['Completed', 'In Progress', 'Pending'],
            values: [65, 20, 15],
            colors: [SUCCESS_COLOR, WARNING_COLOR, ERROR_COLOR]
        };

        var ctx = canvas.getContext('2d');

        // Background gradient for center cutout
        var cutoutGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        cutoutGradient.addColorStop(0, '#F9FAFB');
        cutoutGradient.addColorStop(1, '#F3F4F6');

        var chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderColor: BG_COLOR,
                    borderWidth: 3,
                    hoverOffset: 12,
                    hoverBorderColor: BG_COLOR,
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            font: {
                                size: 13,
                                weight: '500'
                            },
                            color: TEXT_COLOR
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function (context) {
                                var total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                                var value = context.parsed;
                                var percent = ((value / total) * 100).toFixed(1);
                                return ' ' + context.label + ': ' + value + ' (' + percent + '%)';
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            },
            plugins: [{
                id: 'centerText',
                afterDraw: function (chart) {
                    var width = chart.width;
                    var height = chart.height;
                    var ctx2 = chart.ctx;

                    ctx2.save();

                    var total = chart.data.datasets[0].data.reduce(function (a, b) { return a + b; }, 0);
                    var completed = chart.data.datasets[0].data[0] || 0;
                    var percent = ((completed / total) * 100).toFixed(1);

                    var fontSize = (height / 160).toFixed(2);
                    ctx2.font = 'bold ' + fontSize + 'em "Inter", -apple-system, sans-serif';
                    ctx2.textAlign = 'center';
                    ctx2.textBaseline = 'middle';

                    var textX = width / 2;
                    var textY = height / 2 - 6;

                    ctx2.fillStyle = PRIMARY_COLOR;
                    ctx2.fillText(percent + '%', textX, textY);

                    ctx2.font = '0.75em "Inter", -apple-system, sans-serif';
                    ctx2.fillStyle = TEXT_COLOR;
                    ctx2.fillText('Completed', textX, textY + 22);

                    ctx2.restore();
                }
            }]
        });

        return chart;
    }

    // =========================================================================
    // 2. BAR CHART (DEPARTMENT-WISE / TEAM-WISE)
    // =========================================================================

    /**
     * Create a vertical bar chart for department-wise or team-wise data.
     * Default dummy data: Department completion rates.
     * @param {string} canvasId - The canvas element ID.
     * @param {Object} [customData] - Optional custom data { labels, values, label }.
     * @returns {Chart|null} Chart.js instance or null on failure.
     */
    function createBarChart(canvasId, customData) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        destroyChart(canvasId);

        var defaults = {
            labels: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'],
            values: [78, 65, 72, 58, 45, 75],
            label: 'Completion Rate (%)'
        };

        var data = customData || defaults;

        var ctx = canvas.getContext('2d');
        var gradient = createGradient(ctx, PRIMARY_COLOR, 'rgba(37, 99, 235, 0.05)');

        var chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label || 'Completion Rate (%)',
                    data: data.values,
                    backgroundColor: function (context) {
                        var index = context.dataIndex;
                        var colors = [
                            '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                        ];
                        return colors[index % colors.length] + 'CC';
                    },
                    borderColor: function (context) {
                        var colors2 = [
                            '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                        ];
                        return colors2[context.dataIndex % colors2.length];
                    },
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                    hoverBackgroundColor: function (context) {
                        var colors3 = [
                            '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                        ];
                        return colors3[context.dataIndex % colors3.length];
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: data.labels.length > 8,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 12 },
                            color: TEXT_COLOR
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return ' ' + context.dataset.label + ': ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: GRID_COLOR,
                            drawBorder: false,
                            lineWidth: 1
                        },
                        ticks: {
                            color: TEXT_COLOR,
                            font: { size: 11 },
                            stepSize: 20,
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Percentage (%)',
                            color: TEXT_COLOR,
                            font: { size: 12, weight: '500' }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: TEXT_COLOR,
                            font: { size: 11, weight: '500' }
                        },
                        title: {
                            display: true,
                            text: 'Department',
                            color: TEXT_COLOR,
                            font: { size: 12, weight: '500' }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            }
        });

        return chart;
    }

    // =========================================================================
    // 3. LINE CHART (PROGRESS OVER TIME)
    // =========================================================================

    /**
     * Create a line chart showing progress over time (weekly).
     * Default dummy data: Weekly completed profiles over 12 weeks.
     * @param {string} canvasId - The canvas element ID.
     * @param {Object} [customData] - Optional custom data { labels, datasets, ... }.
     * @returns {Chart|null} Chart.js instance or null on failure.
     */
    function createLineChart(canvasId, customData) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        destroyChart(canvasId);

        var defaults = {
            labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
            datasets: [
                {
                    label: 'Profiles Completed',
                    values: [30, 42, 38, 55, 48, 62, 58, 70, 75, 82, 78, 85],
                    color: PRIMARY_COLOR
                },
                {
                    label: 'Target',
                    values: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
                    color: WARNING_COLOR
                }
            ]
        };

        var data = customData || defaults;

        var ctx = canvas.getContext('2d');
        var gradient = createGradient(ctx, PRIMARY_COLOR);

        var datasets = [];
        for (var d = 0; d < data.datasets.length; d++) {
            var ds = data.datasets[d];
            var dsGradient = createGradient(ctx, ds.color);

            datasets.push({
                label: ds.label,
                data: ds.values,
                borderColor: ds.color,
                backgroundColor: d === 0 ? dsGradient : 'transparent',
                fill: d === 0,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: BG_COLOR,
                pointBorderColor: ds.color,
                pointBorderWidth: 2,
                pointHoverBorderWidth: 3,
                borderWidth: 3,
                spanGaps: true
            });
        }

        var chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 12, weight: '500' },
                            color: TEXT_COLOR
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return ' ' + context.dataset.label + ': ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: GRID_COLOR,
                            drawBorder: false,
                            lineWidth: 1
                        },
                        ticks: {
                            color: TEXT_COLOR,
                            font: { size: 11 },
                            stepSize: 20
                        },
                        title: {
                            display: true,
                            text: 'Number of Profiles',
                            color: TEXT_COLOR,
                            font: { size: 12, weight: '500' }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: TEXT_COLOR,
                            font: { size: 11 },
                            maxRotation: 45
                        },
                        title: {
                            display: true,
                            text: 'Week',
                            color: TEXT_COLOR,
                            font: { size: 12, weight: '500' }
                        }
                    }
                },
                animation: {
                    duration: 1400,
                    easing: 'easeOutQuart'
                },
                elements: {
                    line: {
                        tension: 0.35
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 7
                    }
                }
            }
        });

        return chart;
    }

    // =========================================================================
    // 4. HORIZONTAL BAR CHART (RANKINGS)
    // =========================================================================

    /**
     * Create a horizontal bar chart for rankings/leaderboard.
     * Default dummy data: Team leader performance rankings.
     * @param {string} canvasId - The canvas element ID.
     * @param {Object} [customData] - Optional custom data { labels, values, label }.
     * @returns {Chart|null} Chart.js instance or null on failure.
     */
    function createHorizontalBarChart(canvasId, customData) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        destroyChart(canvasId);

        var defaults = {
            labels: ['Sarah Johnson', 'Michael Chen', 'David Kim', 'Emily Rodriguez', 'James Wilson'],
            values: [92, 85, 78, 74, 63],
            label: 'Performance Score'
        };

        var data = customData || defaults;

        var ctx = canvas.getContext('2d');

        // Sort data in descending order for rankings
        var combined = data.labels.map(function (label, index) {
            return { label: label, value: data.values[index] };
        });
        combined.sort(function (a, b) { return b.value - a.value; });

        var sortedLabels = combined.map(function (item) { return item.label; });
        var sortedValues = combined.map(function (item) { return item.value; });

        // Assign colors based on rank
        var barColors = sortedValues.map(function (val, idx) {
            if (idx === 0) return '#2563EB';
            if (idx === 1) return '#10B981';
            if (idx === 2) return '#8B5CF6';
            return '#D1D5DB';
        });

        var chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedLabels,
                datasets: [{
                    label: data.label || 'Performance Score',
                    data: sortedValues,
                    backgroundColor: barColors.map(function (c) { return c + 'CC'; }),
                    borderColor: barColors,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                    hoverBackgroundColor: barColors
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return ' Score: ' + context.parsed.x + '/100';
                            },
                            afterLabel: function (context) {
                                var rank = context.dataIndex + 1;
                                var medals = ['Gold', 'Silver', 'Bronze'];
                                var suffix = rank <= 3 ? ' (' + medals[rank - 1] + ')' : '';
                                return 'Rank: #' + rank + suffix;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: GRID_COLOR,
                            drawBorder: false
                        },
                        ticks: {
                            color: TEXT_COLOR,
                            font: { size: 11 },
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Score (%)',
                            color: TEXT_COLOR,
                            font: { size: 12, weight: '500' }
                        }
                    },
                    y: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: TEXT_COLOR,
                            font: { size: 12, weight: '500' },
                            padding: 8
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 5,
                        right: 20
                    }
                }
            },
            plugins: [{
                id: 'rankBadges',
                afterDraw: function (ch) {
                    var ctx2 = ch.ctx;
                    var xAxis = ch.scales.x;
                    var yAxis = ch.scales.y;

                    ctx2.save();

                    ch.data.labels.forEach(function (label, i) {
                        var rank = i + 1;
                        if (rank <= 3) {
                            var meta = ch.getDatasetMeta(0);
                            var bar = meta.data[i];
                            if (!bar) return;

                            var medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
                            var xPos = xAxis.right - 24;
                            var yPos = bar.y;

                            ctx2.font = '16px sans-serif';
                            ctx2.textAlign = 'center';
                            ctx2.textBaseline = 'middle';
                            ctx2.fillText(medals[rank - 1], xPos, yPos);
                        }
                    });

                    ctx2.restore();
                }
            }]
        });

        return chart;
    }

    // =========================================================================
    // 5. RADAR CHART (TEAM PERFORMANCE)
    // =========================================================================

    /**
     * Create a radar chart for multi-dimensional team performance comparison.
     * Default dummy data: 5 team leaders across 6 metrics.
     * @param {string} canvasId - The canvas element ID.
     * @param {Object} [customData] - Optional custom data.
     * @returns {Chart|null} Chart.js instance or null on failure.
     */
    function createRadarChart(canvasId, customData) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        destroyChart(canvasId);

        var defaults = {
            labels: ['Profiles Updated', 'Data Accuracy', 'Response Time', 'Alumni Reach', 'Events Organized', 'Feedback Score'],
            datasets: [
                {
                    label: 'Sarah Johnson',
                    values: [95, 90, 88, 92, 85, 90],
                    color: '#2563EB'
                },
                {
                    label: 'Michael Chen',
                    values: [85, 88, 82, 78, 90, 86],
                    color: '#10B981'
                },
                {
                    label: 'David Kim',
                    values: [78, 82, 75, 80, 72, 80],
                    color: '#F59E0B'
                },
                {
                    label: 'Emily Rodriguez',
                    values: [74, 70, 80, 72, 78, 76],
                    color: '#8B5CF6'
                },
                {
                    label: 'James Wilson',
                    values: [63, 68, 70, 65, 60, 72],
                    color: '#EC4899'
                }
            ]
        };

        var data = customData || defaults;

        var ctx = canvas.getContext('2d');

        var datasets = data.datasets.map(function (ds) {
            var bgColor = ds.color || '#2563EB';
            // hex to rgba
            var r = parseInt(bgColor.slice(1, 3), 16);
            var g = parseInt(bgColor.slice(3, 5), 16);
            var b = parseInt(bgColor.slice(5, 7), 16);

            return {
                label: ds.label,
                data: ds.values,
                backgroundColor: 'rgba(' + r + ', ' + g + ', ' + b + ', 0.12)',
                borderColor: ds.color,
                borderWidth: 2,
                pointBackgroundColor: ds.color,
                pointBorderColor: BG_COLOR,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true
            };
        });

        var chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 11, weight: '500' },
                            color: TEXT_COLOR,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            display: true,
                            color: TEXT_COLOR,
                            backdropColor: 'transparent',
                            font: { size: 10 },
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: GRID_COLOR,
                            lineWidth: 1
                        },
                        angleLines: {
                            color: GRID_COLOR,
                            lineWidth: 1
                        },
                        pointLabels: {
                            color: TEXT_COLOR,
                            font: { size: 11, weight: '500' }
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                elements: {
                    line: {
                        borderWidth: 2
                    }
                }
            }
        });

        return chart;
    }

    // =========================================================================
    // CONVENIENCE: INITIALIZE ALL CHARTS AT ONCE
    // =========================================================================

    /**
     * Initialize all standard dashboard charts at once.
     * Scans for canvas elements with data attributes:
     *   data-chart="doughnut|bar|line|horizontalBar|radar"
     * @param {Object} [overrides] - Optional custom data overrides keyed by chart type.
     */
    function initAllCharts(overrides) {
        if (!overrides) overrides = {};

        waitForChartJS(function () {
            var canvases = document.querySelectorAll('canvas[data-chart]');

            if (canvases.length === 0) {
                // If no data attributes, look for specific IDs
                var chartIds = ['doughnutChart', 'barChart', 'lineChart', 'horizontalBarChart', 'radarChart'];
                chartIds.forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) {
                        var type = id.replace('Chart', '');
                        type = type.charAt(0).toLowerCase() + type.slice(1);
                        if (type === 'horizontalbar') type = 'horizontalBar';
                        createChartById(id, type, overrides[type]);
                    }
                });
                return;
            }

            canvases.forEach(function (canvas) {
                var chartType = canvas.getAttribute('data-chart');
                var canvasId = canvas.id;
                if (!canvasId) return;

                createChartById(canvasId, chartType, overrides[chartType]);
            });
        });
    }

    /**
     * Create a chart by type string, dispatching to the correct function.
     * @param {string} canvasId - Canvas element ID.
     * @param {string} chartType - Chart type key.
     * @param {Object} [customData] - Custom data override.
     * @returns {Chart|null} Chart instance.
     */
    function createChartById(canvasId, chartType, customData) {
        switch (chartType) {
            case 'doughnut':
            case 'pie':
                return createDoughnutChart(canvasId, customData);
            case 'bar':
                return createBarChart(canvasId, customData);
            case 'line':
                return createLineChart(canvasId, customData);
            case 'horizontalBar':
            case 'horizontalbar':
            case 'horizontal-bar':
                return createHorizontalBarChart(canvasId, customData);
            case 'radar':
                return createRadarChart(canvasId, customData);
            default:
                console.warn('[AlumniApp Charts] Unknown chart type: ' + chartType);
                return null;
        }
    }

    // =========================================================================
    // EXPOSE PUBLIC API
    // =========================================================================

    window.AlumniCharts = {
        createDoughnutChart: createDoughnutChart,
        createBarChart: createBarChart,
        createLineChart: createLineChart,
        createHorizontalBarChart: createHorizontalBarChart,
        createRadarChart: createRadarChart,
        initAllCharts: initAllCharts,
        waitForChartJS: waitForChartJS,
        destroyChart: destroyChart
    };

})();
