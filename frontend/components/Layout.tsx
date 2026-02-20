import React, { ReactNode } from 'react';
import { Box, Flex, useDisclosure, useBreakpointValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import MainNavbar from './MainNavbar';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const isMobile = useBreakpointValue({ base: true, lg: false });

    return (
        <Flex minH="100vh" bg="gray.50" direction="column">
            {/* Sidebar for Desktop / Drawer for Mobile */}
            <Sidebar isOpen={isOpen} onClose={onClose} />

            <Box
                flex="1"
                ml={{ base: 0, lg: "280px" }}
                transition="margin-left 0.3s ease"
                display="flex"
                flexDirection="column"
                minW={0}
            >
                <MainNavbar onOpenSidebar={onOpen} />
                <Box as="main" flex="1" p={{ base: 4, md: 6 }}>
                    {children}
                </Box>
            </Box>
        </Flex>
    );
};

export default Layout;
