// INVESTOR CHART - ROI Growth Projection
if (document.getElementById('investorChart')) {
  const investorCtx = document.getElementById('investorChart').getContext('2d');
  new Chart(investorCtx, {
    type: 'line',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [
        {
          label: 'Investment Value',
          data: [100000, 118000, 139240, 164223, 193783],
          borderColor: '#0071e3',
          backgroundColor: 'rgba(0, 113, 227, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#0071e3',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: 'Market Average',
          data: [100000, 115000, 132250, 152087, 175100],
          borderColor: '#a0aec0',
          backgroundColor: 'rgba(160, 174, 192, 0.05)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#a0aec0',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: 600 },
            color: '#0f172a'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) { return '$' + (value/1000).toFixed(0) + 'K'; },
            color: '#64748b'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            color: '#64748b'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  });
}

// LANDLORD CHART - Vacancy Rate Reduction
if (document.getElementById('landlordChart')) {
  const landlordCtx = document.getElementById('landlordChart').getContext('2d');
  new Chart(landlordCtx, {
    type: 'bar',
    data: {
      labels: ['Before\nManagement', 'Month 3', 'Month 6', 'Month 12', 'Month 24'],
      datasets: [
        {
          label: 'Vacancy Rate %',
          data: [22, 18, 12, 6, 3],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    },
    options: {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 25,
          ticks: {
            callback: function(value) { return value + '%'; },
            color: '#64748b'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            color: '#64748b'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  });
}

// COMMERCIAL CHART - Multi-Location Expansion
if (document.getElementById('commercialChart')) {
  const commercialCtx = document.getElementById('commercialChart').getContext('2d');
  new Chart(commercialCtx, {
    type: 'doughnut',
    data: {
      labels: ['Active Locations', 'Pipeline', 'Development'],
      datasets: [
        {
          data: [42, 18, 7],
          backgroundColor: [
            '#0071e3',
            '#60a5fa',
            '#e0e7ff'
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, weight: 600 },
            color: '#0f172a'
          }
        }
      }
    }
  });
}