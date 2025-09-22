import React, { useContext } from 'react';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Box, Button, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { AuthContext } from '@/contexts/AuthContext.jsx';

const drawerWidth = 240;

const Layout = () => {
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { text: 'Дашборд', icon: <DashboardIcon />, path: '/', roles: ['admin', 'staff', 'head_nurse'] },
    { text: 'Материалы', icon: <InventoryIcon />, path: '/materials', roles: ['admin', 'staff', 'head_nurse'] },
    { text: 'Заявки', icon: <PlaylistAddIcon />, path: '/requests', roles: ['admin', 'head_nurse'] },
    { text: 'Отчеты', icon: <BarChartIcon />, path: '/reports', roles: ['admin', 'head_nurse'] },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Учёт материалов
          </Typography>
          <Typography sx={{ mr: 2 }}>{user?.email}</Typography>
          <Button color="inherit" onClick={logout}>Выйти</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) =>
              (item.roles.includes(user.role)) && (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton component={RouterLink} to={item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )
            )}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;