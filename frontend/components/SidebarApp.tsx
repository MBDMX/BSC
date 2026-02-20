import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
    isOpen?: boolean;
    onClose?: () => void;
}

const SidebarApp: React.FC<SidebarProps> = ({ isOpen = false, onClose = () => { } }) => {
    const router = useRouter();
    const pathname = usePathname();
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
            <Box px={4} py={6}>
                <Text fontSize="2xl" fontWeight="800" letterSpacing="tight" bgGradient="linear(to-r, #FFB6C1, #fff)" bgClip="text">
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
                        onClick={() => {
                            router.push(item.path);
                            if (isMobile) onClose();
                        }}
                        bg={pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
                        color={pathname === item.path ? '#FFB6C1' : 'white'}
                        _hover={{
                            bg: 'rgba(255, 255, 255, 0.05)',
                            color: '#FFB6C1'
                        }}
                        fontSize="md"
                        fontWeight="600"
                    >
                        <Text>{item.name}</Text>
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
                <DrawerContent bg="#03224c" color="white">
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
            bg="linear-gradient(180deg, #03224c 0%, #051937 100%)"
            color="white"
            position="fixed"
            left={0}
            top={0}
            boxShadow="4px 0 10px rgba(0,0,0,0.2)"
            zIndex={100}
        >
            {SidebarContent}
        </Box>
    );
};

export default SidebarApp;
