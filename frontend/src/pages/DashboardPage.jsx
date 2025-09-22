import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import WarningIcon from '@mui/icons-material/Warning';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import api from '@/services/api.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Вспомогательная функция для форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Виджет для Уведомлений
const AlertWidget = ({ title, icon, data, columns }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      {icon}
      <Typography variant="h6" component="h3" sx={{ ml: 1 }}>{title}</Typography>
    </Box>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => <TableCell key={col.id}>{col.label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length > 0 ? data.map((item, index) => (
            <TableRow key={index}>
               {columns.map((col) => <TableCell key={col.id}>{col.render ? col.render(item) : item[col.id]}</TableCell>)}
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={columns.length} align="center">Нет данных</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

// Виджет для Диаграммы
const ChartWidget = ({ title, chartData }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Pie data={chartData} options={options} />
    </Paper>
  );
};


const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке статистики:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (!stats) {
    return <Typography>Не удалось загрузить данные для дашборда.</Typography>;
  }

  const chartData = {
    labels: stats.material_distribution.map(item => item.name),
    datasets: [{
      label: 'Количество',
      data: stats.material_distribution.map(item => item.total_quantity),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const lowStockColumns = [
    { id: 'name', label: 'Название' },
    { id: 'total_quantity', label: 'Остаток' },
    { id: 'min_quantity', label: 'Мин.' },
  ];

  const expiringColumns = [
    { id: 'material', label: 'Название', render: (item) => item.material.name },
    { id: 'current_quantity', label: 'Кол-во' },
    { id: 'expiration_date', label: 'Срок годности', render: (item) => formatDate(item.expiration_date) },
  ];


  return (
    <Box>
      <Typography variant="h4" gutterBottom>Дашборд</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <AlertWidget
                title="Материалы заканчиваются"
                icon={<WarningIcon color="warning"/>}
                data={stats.low_stock_items}
                columns={lowStockColumns}
            />
        </Grid>
        <Grid item xs={12} md={6}>
            <AlertWidget
                title="Истекает срок годности"
                icon={<EventBusyIcon color="error"/>}
                data={stats.expiring_soon_batches}
                columns={expiringColumns}
            />
        </Grid>
        <Grid item xs={12} md={8} lg={6}>
            <ChartWidget title="Топ-10 материалов по количеству" chartData={chartData} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;