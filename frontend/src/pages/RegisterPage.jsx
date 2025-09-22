import React, { useState } from 'react'; // <--- ИСПРАВЛЕНО
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  TextField, Button, Container, Typography, Box, FormControl,
  InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import api from '@/services/api.js';
// ...

// ... (остальной код файла остается без изменений)
const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/users/', { email, password, role });
      alert('Регистрация прошла успешно! Теперь вы можете войти.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Произошла ошибка при регистрации.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Регистрация нового пользователя</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField required fullWidth id="email" label="Email-адрес" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth name="password" label="Пароль" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Роль</InputLabel>
                <Select labelId="role-select-label" id="role-select" value={role} label="Роль" onChange={(e) => setRole(e.target.value)}>
                  <MenuItem value={'staff'}>Сотрудник</MenuItem>
                  <MenuItem value={'head_nurse'}>Старшая медсестра</MenuItem>
                  <MenuItem value={'admin'}>Администратор</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {error && (<Typography color="error" sx={{ mt: 2 }}>{error}</Typography>)}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Зарегистрироваться</Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Button component={RouterLink} to="/login">Уже есть аккаунт? Войти</Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;