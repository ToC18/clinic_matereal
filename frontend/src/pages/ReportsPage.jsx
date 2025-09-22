import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

const ReportsPage = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Отчеты и аналитика
            </Typography>
            <Paper sx={{ p: 4, mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                <ConstructionIcon sx={{ fontSize: 60, color: 'grey.500', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    Раздел находится в разработке
                </Typography>
                <Typography color="text.secondary" align="center">
                    Здесь скоро появятся красивые и интерактивные диаграммы для анализа расхода материалов,
                    отслеживания затрат и формирования складских отчетов.
                </Typography>
            </Paper>
        </Box>
    );
};

export default ReportsPage;