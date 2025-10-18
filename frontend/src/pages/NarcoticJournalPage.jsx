import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import api from '@/services/api.js';
import { translateUnit } from '@/utils/translation.js';

const NarcoticJournalPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/narcotic-logs/');
        setLogs(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке журнала:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Журнал учета наркотических средств</Typography>
      <Paper>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Дата и время</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Наименование</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Количество</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Пациент</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Причина назначения</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Сотрудник</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.material.name}</TableCell>
                    <TableCell align="right">{`${Math.abs(log.delta)} ${translateUnit(log.material.unit)}`}</TableCell>
                    <TableCell>{log.patient_info}</TableCell>
                    <TableCell>{log.reason}</TableCell>
                    <TableCell>{log.user.full_name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} align="center">Записи отсутствуют</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default NarcoticJournalPage;