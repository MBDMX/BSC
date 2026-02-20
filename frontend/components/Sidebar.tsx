import React from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    VStack,
    Icon,
    Text,
    Button,
    Divider,
    useToast,
    IconButton,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useBreakpointValue,
} from '@chakra-ui/react';
import {
    MdDashboard,
    MdRestaurantMenu,
    MdInventory,
    MdReceipt,
    MdAttachMoney,
    MdSettings,
    MdLogout,
    MdTimeline
} from 'react-icons/md';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, lg: false });

    const menuItems = [
        { name: 'Accueil', icon: MdDashboard, path: '/', mobileOnly: true },
        { name: 'Dashboard', icon: MdDashboard, path: '/dashboard' },
        { name: 'Menu', icon: MdRestaurantMenu, path: '/menu-management' },
        { name: 'Matières Premières', icon: MdInventory, path: '/matieres-premieres' },
        { name: 'Bilan Mensuel', icon: MdReceipt, path: '/bilan-mensuelle' },
        { name: 'Gestion Factures', icon: MdReceipt, path: '/factures' },
        { name: 'Gestion Ventes', icon: MdAttachMoney, path: '/gestion-ventes' },
        { name: 'Charges', icon: MdAttachMoney, path: '/charges-summary' },
        { name: 'Analyse Annuelle', icon: MdTimeline, path: '/analyse-annuelle', mobileOnly: true },
        { name: 'Analytics', icon: MdTimeline, path: '/analytics', mobileOnly: true },
        { name: 'Prédictions', icon: MdTimeline, path: '/predictions' },
    ];

    const filteredMenuItems = isMobile
        ? menuItems
        : menuItems.filter(item => !item.mobileOnly);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        toast({
            title: "Déconnexion réussie",
            status: "info",
            duration: 3000,
            isClosable: true,
        });
        router.push('/login');
    };

    const SidebarContent = (
        <VStack align="stretch" spacing={4} h="full">
            <Box px={6} py={8}>
                <Text fontSize="2xl" fontWeight="900" letterSpacing="widest" color="var(--rose)" textTransform="uppercase">
                    BSC ADMIN
                </Text>
            </Box>

            <VStack spacing={1} align="stretch" flex={1} px={2}>
                {filteredMenuItems.map((item) => (
                    <Button
                        key={item.path}
                        variant="ghost"
                        justifyContent="flex-start"
                        h="50px"
                        leftIcon={<Icon as={item.icon} boxSize={5} />}
                        onMouseEnter={() => router.prefetch(item.path)} // Hyper-Speed Pre-fetch
                        onClick={() => {
                            router.push(item.path);
                            if (isMobile) onClose();
                        }}
                        bg={router.pathname === item.path ? 'whiteAlpha.200' : 'transparent'}
                        color={router.pathname === item.path ? 'var(--rose)' : 'whiteAlpha.800'}
                        _hover={{
                            bg: 'whiteAlpha.100',
                            color: 'var(--rose)',
                            transform: 'translateX(4px)'
                        }}
                        transition="all 0.2s"
                        fontSize="sm"
                        fontWeight="600"
                        borderRadius="0"
                        borderLeft={router.pathname === item.path ? '4px solid var(--rose)' : 'none'}
                    >
                        <Text ml={2}>{item.name}</Text>
                    </Button>
                ))}
            </VStack>

            <Box p={4}>
                <Divider opacity={0.1} mb={4} />
                <VStack spacing={2} align="stretch">
                    <Button
                        variant="ghost"
                        justifyContent="flex-start"
                        h="50px"
                        leftIcon={<Icon as={MdSettings} boxSize={5} />}
                        onClick={() => {
                            router.push('/settings');
                            if (isMobile) onClose();
                        }}
                        color="whiteAlpha.800"
                        _hover={{ color: '#FFB6C1', bg: 'rgba(255, 255, 255, 0.05)' }}
                        fontSize="md"
                    >
                        <Text>Paramètres</Text>
                    </Button>
                    <Button
                        variant="ghost"
                        justifyContent="flex-start"
                        h="50px"
                        leftIcon={<Icon as={MdLogout} boxSize={5} />}
                        onClick={handleLogout}
                        color="red.300"
                        _hover={{ color: 'red.200', bg: 'rgba(255, 0, 0, 0.05)' }}
                        fontSize="md"
                    >
                        <Text>Déconnexion</Text>
                    </Button>
                </VStack>
            </Box>
        </VStack>
    );

    if (isMobile) {
        return (
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent bg="#0a192f" color="white">
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="0px">Navigation</DrawerHeader>
                    <DrawerBody p={0}>
                        {SidebarContent}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Box
            w="280px"
            h="100vh"
            bg="#0a192f"
            color="white"
            position="fixed"
            left={0}
            top={0}
            boxShadow="xl"
            zIndex={100}
            borderRight="1px solid"
            borderColor="whiteAlpha.100"
        >
            {SidebarContent}
        </Box>
    );
};

export default Sidebar;
