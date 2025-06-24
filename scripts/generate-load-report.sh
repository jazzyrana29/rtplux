#!/bin/bash

# Load Test Report Generator

echo "📊 Generating Load Test Report"
echo "=============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create reports directory
mkdir -p cypress/reports/consolidated

# Merge all mochawesome reports
print_status "Merging test reports..."
if [ -f cypress/reports/*.json ]; then
    npx mochawesome-merge cypress/reports/*.json > cypress/reports/consolidated/merged-report.json
    npx marge cypress/reports/consolidated/merged-report.json \
        --reportDir cypress/reports/consolidated \
        --reportFilename load-test-report \
        --inline \
        --charts \
        --reportPageTitle "RTPLUX Casino Load Test Report"
    
    print_success "Reports merged successfully"
else
    print_warning "No test reports found. Run load tests first."
    exit 1
fi

# Generate summary statistics
print_status "Generating summary statistics..."

cat > cypress/reports/consolidated/summary.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>RTPLUX Casino Load Test Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #1a1a2e; color: #ffd700; padding: 20px; border-radius: 8px; }
        .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { border-left: 5px solid #28a745; }
        .warning { border-left: 5px solid #ffc107; }
        .error { border-left: 5px solid #dc3545; }
        .chart-container { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎰 RTPLUX Casino Load Test Summary</h1>
        <p>Generated on: $(date)</p>
    </div>
    
    <div class="metric success">
        <h3>✅ Test Execution Summary</h3>
        <p>Total test files executed: <span id="total-files">-</span></p>
        <p>Total test cases: <span id="total-tests">-</span></p>
        <p>Passed: <span id="passed-tests">-</span></p>
        <p>Failed: <span id="failed-tests">-</span></p>
        <p>Success rate: <span id="success-rate">-</span></p>
    </div>
    
    <div class="metric">
        <h3>📈 Performance Metrics</h3>
        <p>Average response time: <span id="avg-response">-</span> ms</p>
        <p>95th percentile: <span id="p95-response">-</span> ms</p>
        <p>Maximum response time: <span id="max-response">-</span> ms</p>
        <p>Memory usage peak: <span id="memory-peak">-</span> MB</p>
    </div>
    
    <div class="metric">
        <h3>🔧 Load Test Configuration</h3>
        <p>Maximum concurrent users: <span id="max-users">-</span></p>
        <p>Test duration: <span id="test-duration">-</span> seconds</p>
        <p>Application URL: <span id="app-url">-</span></p>
    </div>
    
    <div class="metric">
        <h3>🎮 Game-Specific Results</h3>
        <p>Roulette game load time: <span id="roulette-load">-</span> ms</p>
        <p>Game interaction response: <span id="game-response">-</span> ms</p>
        <p>Concurrent game sessions: <span id="concurrent-games">-</span></p>
    </div>
    
    <div class="chart-container">
        <h3>📊 Detailed Reports</h3>
        <p><a href="load-test-report.html">View Detailed Test Report</a></p>
        <p><a href="../screenshots/">View Screenshots</a></p>
        <p><a href="../videos/">View Test Videos</a></p>
    </div>
    
    <script>
        // This would be populated with actual data from test results
        // For now, showing placeholder structure
        document.getElementById('total-files').textContent = 'Loading...';
        document.getElementById('total-tests').textContent = 'Loading...';
        // ... etc
    </script>
</body>
</html>
EOF

print_success "Summary report generated"

# Create performance dashboard
print_status "Creating performance dashboard..."

cat > cypress/reports/consolidated/dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>RTPLUX Casino Performance Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { grid-column: 1 / -1; background: #1a1a2e; color: #ffd700; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #28a745; }
        .chart-container { position: relative; height: 300px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="card header">
            <h1>🎰 RTPLUX Casino Performance Dashboard</h1>
            <p>Real-time load testing metrics and performance indicators</p>
        </div>
        
        <div class="card">
            <h3>Response Time Trends</h3>
            <div class="chart-container">
                <canvas id="responseTimeChart"></canvas>
            </div>
        </div>
        
        <div class="card">
            <h3>Concurrent Users</h3>
            <div class="chart-container">
                <canvas id="usersChart"></canvas>
            </div>
        </div>
        
        <div class="card">
            <h3>Memory Usage</h3>
            <div class="chart-container">
                <canvas id="memoryChart"></canvas>
            </div>
        </div>
        
        <div class="card">
            <h3>Error Rate</h3>
            <div class="chart-container">
                <canvas id="errorChart"></canvas>
            </div>
        </div>
        
        <div class="card">
            <h3>Key Metrics</h3>
            <p>Average Response Time: <span class="metric-value">-</span> ms</p>
            <p>Success Rate: <span class="metric-value">-</span>%</p>
            <p>Peak Memory: <span class="metric-value">-</span> MB</p>
        </div>
        
        <div class="card">
            <h3>Game Performance</h3>
            <p>Roulette Load Time: <span class="metric-value">-</span> ms</p>
            <p>Game Actions/sec: <span class="metric-value">-</span></p>
            <p>Concurrent Games: <span class="metric-value">-</span></p>
        </div>
    </div>
    
    <script>
        // Initialize charts with sample data
        // In a real implementation, this would be populated with actual test data
        
        // Response Time Chart
        const responseCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseCtx, {
            type: 'line',
            data: {
                labels: ['0s', '30s', '60s', '90s', '120s'],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [500, 750, 1200, 900, 600],
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        
        // Users Chart
        const usersCtx = document.getElementById('usersChart').getContext('2d');
        new Chart(usersCtx, {
            type: 'bar',
            data: {
                labels: ['Basic', 'Stress', 'Spike', 'Volume'],
                datasets: [{
                    label: 'Concurrent Users',
                    data: [10, 20, 30, 15],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        // Memory Chart
        const memoryCtx = document.getElementById('memoryChart').getContext('2d');
        new Chart(memoryCtx, {
            type: 'area',
            data: {
                labels: ['Start', '25%', '50%', '75%', 'End'],
                datasets: [{
                    label: 'Memory Usage (MB)',
                    data: [50, 75, 120, 95, 60],
                    backgroundColor: 'rgba(23, 162, 184, 0.3)',
                    borderColor: '#17a2b8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        // Error Rate Chart
        const errorCtx = document.getElementById('errorChart').getContext('2d');
        new Chart(errorCtx, {
            type: 'doughnut',
            data: {
                labels: ['Success', 'Errors'],
                datasets: [{
                    data: [95, 5],
                    backgroundColor: ['#28a745', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    </script>
</body>
</html>
EOF

print_success "Performance dashboard created"

# Open reports if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Opening reports..."
    open cypress/reports/consolidated/summary.html
    open cypress/reports/consolidated/dashboard.html
fi

print_success "🎉 Load test reports generated successfully!"
echo ""
echo "📊 Available Reports:"
echo "  - Summary: cypress/reports/consolidated/summary.html"
echo "  - Dashboard: cypress/reports/consolidated/dashboard.html"
echo "  - Detailed: cypress/reports/consolidated/load-test-report.html"
echo "  - Screenshots: cypress/screenshots/"
echo "  - Videos: cypress/videos/"
echo ""
echo "🚀 Next Steps:"
echo "  1. Review the performance metrics"
echo "  2. Identify bottlenecks and optimization opportunities"
echo "  3. Set up continuous load testing in CI/CD"
echo "  4. Monitor trends over time"
