import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import { AuthContext } from '@/contexts/AuthContext.jsx';
import api from '@/services/api.js';
import { translateRole } from '@/utils/translation.js';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await api.get('/users/me/activity');
        setActivity(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке активности:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Личный кабинет</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Личные данные</Typography>
        <Typography><b>ФИО:</b> {user?.full_name}</Typography>
        <Typography><b>Email:</b> {user?.email}</Typography>
        <Typography><b>Должность:</b> {translateRole(user?.role)}</Typography>
      </Paper>

      <Typography variant="h6">История действий</Typography>
      <Paper>
        <List>
          {loading ? <CircularProgress sx={{m: 2}}/> : activity.length > 0 ? activity.map((log, index) => (
            <React.Fragment key={log.id}>
              <ListItem>
                <ListItemText
                  primary={log.action}
                  secondary={`${new Date(log.created_at).toLocaleString()} - ${log.details || ''}`}
                />
              </ListItem>
              {index < activity.length - 1 && <Divider />}
            </React.Fragment>
          )) : <ListItem><ListItemText primary="История действий пуста." /></ListItem>}
        </List>
      </Paper>
    </Box>
  );
};

export default ProfilePage;