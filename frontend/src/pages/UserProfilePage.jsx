import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import api from '@/services/api.js';
import { translateRole } from '@/utils/translation.js';

const UserProfilePage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userResponse = await api.get(`/users/${userId}`);
        setUser(userResponse.data);
        const activityResponse = await api.get(`/users/${userId}/activity`);
        setActivity(activityResponse.data);
      } catch (error) {
        console.error("Ошибка при загрузке данных профиля:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (!user) {
    return <Typography>Сотрудник не найден.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Профиль сотрудника</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Личные данные</Typography>
        <Typography><b>ФИО:</b> {user.full_name}</Typography>
        <Typography><b>Электронная почта:</b> {user.email}</Typography>
        <Typography><b>Должность:</b> {translateRole(user.role)}</Typography>
      </Paper>

      <Typography variant="h6">История действий</Typography>
      <Paper>
        <List>
          {activity.length > 0 ? activity.map((log, index) => (
            <React.Fragment key={log.id}>
              <ListItem>
                <ListItemText
                  primary={log.action}
                  secondary={`${new Date(log.created_at).toLocaleString()} - ${log.details || ''}`}
                />
              </ListItem>
              {index < activity.length - 1 && <Divider />}
            </React.Fragment>
          )) : (
            <ListItem><ListItemText primary="История действий пуста." /></ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default UserProfilePage;