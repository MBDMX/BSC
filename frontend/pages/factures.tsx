import { Container, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Box } from '@chakra-ui/react';
import InvoiceManager from '../components/InvoiceManager';
import { MdChevronRight } from 'react-icons/md';

export default function FacturesPage() {
    return (
        <Container maxW="container.xl" py={8}>
            <Breadcrumb spacing="8px" separator={<MdChevronRight color="gray.500" />} mb={6}>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink href="#">Gestion des Factures</BreadcrumbLink>
                </BreadcrumbItem>
            </Breadcrumb>

            <InvoiceManager />
        </Container>
    );
}
