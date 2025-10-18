import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, Link
} from '@mui/material';
import api from '../services/api.js';
import { translateRole } from '../utils/translation.js';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/');
        setUsers(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getRoleChipColor = (role) => {
    switch(role) {
        case 'admin': return 'error';
        case 'head_nurse': return 'warning';
        default: return 'primary';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Список сотрудников</Typography>
      <Paper>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ФИО</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Должность</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
              ) : users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      <Link component={RouterLink} to={`/users/${user.id}`}>
                        {user.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Chip label={translateRole(user.role)} color={getRoleChipColor(user.role)} size="small" />
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default UsersPage;