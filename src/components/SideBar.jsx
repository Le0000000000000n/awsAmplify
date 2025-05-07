import { Drawer, List, ListItem, ListItemText, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';

function SidebarComponent({ drawerWidth }) {
  const menuItems = [
    { text: 'Portfolio', path: '/dashboard' },
    { text: 'Watchlist', path: '/watchlist' },
    { text: 'Alerts', path: '/alerts' },
    { text: 'News', path: '/news' },

  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} button component={Link} to={item.path}>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default SidebarComponent;