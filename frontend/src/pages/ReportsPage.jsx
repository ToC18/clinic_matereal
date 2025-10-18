import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Box, CircularProgress } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '@/services/api.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportsPage = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        const data = response.data.material_distribution;

        setChartData({
          labels: data.map(item => item.name),
          datasets: [{
            label: 'Остаток на складе (шт/мл)',
            data: data.map(item => item.total_quantity),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          }]
        });
      } catch (error) {
        console.error("Ошибка при загрузке данных для отчета:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Отчеты</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Топ-10 материалов по количеству на складе</Typography>
            {loading ? <CircularProgress /> : (
              chartData && <Bar data={chartData} options={{ responsive: true }}/>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;