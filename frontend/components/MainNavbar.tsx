import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Box,
  Flex,
  Text,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  useToast
} from '@chakra-ui/react';
import { MdNotifications, MdMenu } from 'react-icons/md';

interface MainNavbarProps {
  onOpenSidebar?: () => void;
}

export default function MainNavbar({ onOpenSidebar }: MainNavbarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(router.pathname);
  const [alerts, setAlerts] = useState<any[]>([]);
  const toast = useToast();

  const navItems = [
    { key: 'home', label: '🏠 Accueil', path: '/' },
    { key: 'annual', label: '📊 Analyse Annuelle', path: '/analyse-annuelle' },
    { key: 'analytics', label: '📈 Analytics', path: '/analytics' }
  ];

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
        if (isLocalhost) {
          try {
            const response = await fetch('http://localhost:8000/alerts', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              const data = await response.json();
              setAlerts(data);
              return;
            }
          } catch (e) {
            // fallback to Supabase
          }
        }

        // Cloud Supabase fallback:
        const { data: prods } = await supabase.from('products').select('*');
        if (prods) {
          const lowStock = prods
            .filter((p: any) => (p.quantite || 0) <= (p.seuil || 10))
            .map((p: any) => ({
              ingredient_nom: p.nom,
              stock_actuel: p.quantite || 0,
              unite: p.unite || 'unité',
              seuil_alerte: p.seuil || 10
            }));
          setAlerts(lowStock);
        }
      } catch (error) {
        console.warn('Erreur lors du chargement des alertes:', error);
      }
    };

    fetchAlerts();

    // Supabase Realtime: re‑fetch alerts whenever any product row changes
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNavigation = (path: string) => {
    setActiveTab(path);
    router.push(path);
  };

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding="1rem 2rem"
      bg="#0a192f"
      color="white"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
      position="sticky"
      top="0"
      zIndex="100"
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
    >
      {/* Brand/Logo Section */}
      <Flex align="center" gap={4}>
        <IconButton
          display={{ base: "flex", lg: "none" }}
          aria-label="Open Menu"
          icon={<MdMenu size={24} />}
          variant="ghost"
          color="white"
          onClick={onOpenSidebar}
          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Box cursor="pointer" onClick={() => router.push('/')}>
          <Text
            fontSize={{ base: "md", md: "xl" }}
            fontWeight="900"
            color="var(--rose)"
            letterSpacing="widest"
            whiteSpace="nowrap"
          >
            BURGER SOCIAL CLUB
          </Text>
        </Box>
      </Flex>

      {/* Navigation Links - Hidden on mobile, moved to Sidebar instead */}
      <Flex gap="1rem" display={{ base: "none", md: "flex" }}>
        {navItems.map((item) => (
          <Button
            key={item.key}
            onClick={() => handleNavigation(item.path)}
            variant="ghost"
            bg={activeTab === item.path ? 'whiteAlpha.200' : 'transparent'}
            color={activeTab === item.path ? 'var(--rose)' : 'whiteAlpha.800'}
            borderRadius="0"
            borderBottom={activeTab === item.path ? '2px solid var(--rose)' : 'none'}
            _hover={{ bg: 'whiteAlpha.100', color: 'var(--rose)' }}
            fontWeight="600"
            fontSize="0.9rem"
            onMouseEnter={() => router.prefetch(item.path)} // Hyper-Speed
          >
            {item.label}
          </Button>
        ))}
      </Flex>

      {/* Notifications Section */}
      <Box>
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Notifications"
            icon={<MdNotifications size={24} />}
            variant="ghost"
            color="white"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            position="relative"
          >
            {alerts.length > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-1"
                right="-1"
                fontSize="0.7em"
              >
                {alerts.length}
              </Badge>
            )}
          </MenuButton>
          <MenuList color="gray.800" maxH="400px" overflowY="auto" boxShadow="xl" borderRadius="lg">
            <Box px={4} py={2} fontWeight="bold" borderBottom="1px solid #eee">
              Alertes Stock Faible
            </Box>
            {alerts.length === 0 ? (
              <Box p={4} textAlign="center" color="gray.500">Aucune alerte</Box>
            ) : (
              alerts.map((alert, idx) => (
                <MenuItem key={idx} flexDir="column" alignItems="flex-start" py={3}>
                  <Text fontWeight="bold">{alert.ingredient_nom}</Text>
                  <Text fontSize="xs" color="red.500">
                    Stock actuel: {alert.stock_actuel} {alert.unite} (Seuil: {alert.seuil_alerte})
                  </Text>
                </MenuItem>
              ))
            )}
          </MenuList>
        </Menu>
      </Box>
    </Flex>
  );
}