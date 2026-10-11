import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    SimpleGrid,
    Card,
    CardBody,
    Stack,
    HStack,
    VStack,
    Button,
    Select,
    Input,
    FormControl,
    FormLabel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Icon,
    Flex,
    Badge,
    Divider,
    IconButton,
    useToast,
    Spinner,
    useBreakpointValue,
} from '@chakra-ui/react';
import { FiDollarSign, FiTrash2, FiPlus, FiClock, FiLayers, FiCalendar } from 'react-icons/fi';

interface Product {
    id: number;
    nom: string;
    prix: number;
    categorie: string;
}

interface Sale {
    id: number;
    produit_nom: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
    date: string;
}

import { supabase } from '../lib/supabaseClient';

export default function SalesManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    // Helper to get local ISO string (YYYY-MM-DDTHH:mm)
    const getLocalISOString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
        return localISOTime;
    };

    const [saleDate, setSaleDate] = useState<string>(getLocalISOString());

    const toast = useToast();

    useEffect(() => {
        fetchProducts();
        fetchSales();
    }, []);

    const fetchProducts = async () => {
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            if (isLocalhost) {
                try {
                    const response = await fetch('http://localhost:8000/menu-data');
                    if (response.ok) {
                        const data = await response.json();
                        setProducts(data.filter((p: Product) => !p.nom.toLowerCase().includes('bun')));
                        return;
                    }
                } catch (e) {
                    console.warn('Local menu-data unreachable, trying Supabase:', e);
                }
            }

            // Supabase fallback:
            const { data: prods } = await supabase.from('products').select('*');
            if (prods && prods.length > 0) {
                setProducts(
                    prods
                        .filter((p: any) => p.categorie === 'Main Product' || p.type === 'PRODUCT')
                        .map((p: any) => ({
                            id: p.id,
                            nom: p.nom,
                            prix: p.prix || p.cout_unitaire || 15,
                            categorie: p.categorie || 'Main Product'
                        }))
                );
            }
        } catch (error) {
            console.warn('Erreur produits:', error);
        }
    };

    const fetchSales = async () => {
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            const url = isLocalhost ? 'http://localhost:8000/sales' : '/api/sales';
            try {
                const response = await fetch(url, isLocalhost ? {} : {});
                if (response.ok) {
                    setSales(await response.json());
                    return;
                }
            } catch (e) {
                console.warn('Sales fetch failed, using localStorage:', e);
            }

            // localStorage fallback
            const saved = localStorage.getItem('bsc_cloud_sales');
            if (saved) setSales(JSON.parse(saved));
        } catch (error) {
            console.warn('Erreur ventes:', error);
        }
    };

    const handleDeleteSale = async (id: number) => {
        if (!confirm('Voulez-vous vraiment supprimer cette vente ?')) return;

        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            const url = isLocalhost ? `http://localhost:8000/sales/${id}` : `/api/sales?id=${id}`;
            const headers: Record<string, string> = {};
            if (isLocalhost) headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;

            await fetch(url, { method: 'DELETE', headers }).catch(() => null);

            setSales(prev => {
                const updated = prev.filter(s => s.id !== id);
                localStorage.setItem('bsc_cloud_sales', JSON.stringify(updated));
                return updated;
            });
            toast({ title: 'Vente supprimée', status: 'success', duration: 3000 });
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast({ title: 'Erreur lors de la suppression', status: 'error' });
        }
    };

    const handleSale = async () => {
        if (!selectedProductId) {
            toast({ title: 'Veuillez sélectionner un produit', status: 'warning', duration: 3000 });
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        setLoading(true);
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            const url = isLocalhost ? 'http://localhost:8000/sales' : '/api/sales';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (isLocalhost) headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;

            const body = JSON.stringify({
                produit_nom: product.nom,
                produit_id: product.id,
                quantite: quantity,
                prix_unitaire: product.prix,
                date: saleDate.replace('T', ' ') + ':00'
            });

            try {
                const response = await fetch(url, { method: 'POST', headers, body });
                if (response.ok) {
                    toast({ title: 'Vente enregistrée !', status: 'success', duration: 3000 });
                    setQuantity(1);
                    setSelectedProductId('');
                    setSaleDate(getLocalISOString());
                    await fetchSales();
                    return;
                }
            } catch (e) {
                console.warn('Sale save failed, using local fallback:', e);
            }

            // localStorage fallback
            const newSale: Sale = {
                id: Date.now(),
                produit_nom: product.nom,
                quantite: quantity,
                prix_unitaire: product.prix,
                total: quantity * product.prix,
                date: saleDate.replace('T', ' ') + ':00'
            };
            setSales(prev => {
                const updated = [newSale, ...prev];
                localStorage.setItem('bsc_cloud_sales', JSON.stringify(updated));
                return updated;
            });
            toast({ title: 'Vente enregistrée !', status: 'success', duration: 3000 });
            setSelectedProductId('');
            setSaleDate(getLocalISOString());
        } catch (error) {
            console.error('Erreur vente:', error);
            toast({ title: 'Erreur lors de l\'enregistrement', status: 'error' });
        } finally {
            setLoading(false);
        }
    };


    const isMobile = useBreakpointValue({ base: true, md: false });

    return (
        <Box minH="100vh" bg="gray.50" py={{ base: 6, md: 10 }} px={{ base: 4, md: 10 }}>
            <Container maxW="container.xl">
                {/* Formulaire Nouvelle Vente */}
                <Card
                    variant="elevated"
                    borderRadius="3xl"
                    overflow="hidden"
                    shadow="xl"
                    border="1px solid"
                    borderColor="gray.100"
                    bg="white"
                    mb={8}
                >
                    <CardBody p={{ base: 6, md: 8 }}>
                        <Heading size="md" color="#03224c" mb={6} display="flex" alignItems="center" gap={3}>
                            <Icon as={FiDollarSign} color="green.500" />
                            Nouvelle Vente
                        </Heading>

                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} alignSelf="end">
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Produit</FormLabel>
                                <Select
                                    placeholder="Choisir un burger..."
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                                    size="lg"
                                    borderRadius="xl"
                                    bg="white"
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.nom} - {p.prix} DT</option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Quantité</FormLabel>
                                <Input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    size="lg"
                                    borderRadius="xl"
                                    bg="white"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Date & Heure</FormLabel>
                                <Input
                                    type="datetime-local"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    size="lg"
                                    borderRadius="xl"
                                    bg="white"
                                />
                            </FormControl>

                            <Box pt={{ base: 0, lg: 8 }}>
                                <Button
                                    w="full"
                                    size="lg"
                                    height="3.5rem"
                                    colorScheme="green"
                                    borderRadius="xl"
                                    onClick={handleSale}
                                    isLoading={loading}
                                    leftIcon={<FiPlus />}
                                    boxShadow="0 4px 15px rgba(16, 185, 129, 0.3)"
                                >
                                    Enregistrer
                                </Button>
                            </Box>
                        </SimpleGrid>
                    </CardBody>
                </Card>

                {/* Historique des Ventes */}
                <Card
                    variant="elevated"
                    borderRadius="3xl"
                    overflow="hidden"
                    shadow="xl"
                    border="1px solid"
                    borderColor="gray.100"
                    bg="white"
                >
                    <CardBody p={{ base: 0 }}>
                        <Box p={6} borderBottom="1px solid" borderColor="gray.50">
                            <Heading size="sm" color="#03224c" display="flex" alignItems="center" gap={3}>
                                <Icon as={FiLayers} color="blue.500" />
                                Historique des Ventes
                            </Heading>
                        </Box>

                        {isMobile ? (
                            <VStack spacing={0} divider={<Divider />}>
                                {sales.length === 0 ? (
                                    <Box py={8} textAlign="center" color="gray.500">
                                        <Text fontSize="sm">Aucune vente enregistrée.</Text>
                                    </Box>
                                ) : (
                                    sales.map((sale) => (
                                        <Box key={sale.id} p={4} w="full">
                                            <Flex justify="space-between" mb={1}>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="bold" fontSize="sm" color="#03224c">{sale.produit_nom}</Text>
                                                    <Text fontSize="xs" color="gray.400">
                                                        {new Date(sale.date).toLocaleString('fr-FR', {
                                                            day: '2-digit', month: '2-digit',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </Text>
                                                </VStack>
                                                <VStack align="end" spacing={0}>
                                                    <Text fontWeight="black" color="green.500" fontSize="sm">
                                                        {sale.total.toFixed(2)} DT
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {sale.quantite} x {sale.prix_unitaire}
                                                    </Text>
                                                </VStack>
                                            </Flex>
                                            <Flex justify="flex-end" mt={2}>
                                                <IconButton
                                                    aria-label="Supprimer"
                                                    icon={<FiTrash2 />}
                                                    size="xs"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() => handleDeleteSale(sale.id)}
                                                />
                                            </Flex>
                                        </Box>
                                    ))
                                )}
                            </VStack>
                        ) : (
                            <TableContainer maxHeight="600px" overflowY="auto">
                                <Table variant="simple" size="sm">
                                    <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                                        <Tr>
                                            <Th color="gray.400" textTransform="none">Date</Th>
                                            <Th color="gray.400" textTransform="none">Produit</Th>
                                            <Th isNumeric color="gray.400" textTransform="none">Qté</Th>
                                            <Th isNumeric color="gray.400" textTransform="none">Prix</Th>
                                            <Th isNumeric color="gray.400" textTransform="none">Total</Th>
                                            <Th color="gray.400" textTransform="none" textAlign="center">Action</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {sales.length === 0 ? (
                                            <Tr>
                                                <Td colSpan={6} textAlign="center" py={12}>
                                                    <VStack spacing={2} opacity={0.5}>
                                                        <Icon as={FiClock} boxSize={8} />
                                                        <Text fontSize="sm">Aucune vente enregistrée.</Text>
                                                    </VStack>
                                                </Td>
                                            </Tr>
                                        ) : (
                                            sales.map((sale) => (
                                                <Tr key={sale.id} _hover={{ bg: "gray.50" }}>
                                                    <Td fontSize="xs" color="gray.500">
                                                        {new Date(sale.date).toLocaleString('fr-FR', {
                                                            day: '2-digit', month: '2-digit',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </Td>
                                                    <Td fontWeight="bold" color="#03224c">{sale.produit_nom}</Td>
                                                    <Td isNumeric>{sale.quantite}</Td>
                                                    <Td isNumeric>{sale.prix_unitaire} DT</Td>
                                                    <Td isNumeric fontWeight="black" color="green.500">
                                                        {sale.total.toFixed(2)} DT
                                                    </Td>
                                                    <Td textAlign="center">
                                                        <IconButton
                                                            aria-label="Supprimer"
                                                            icon={<FiTrash2 />}
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            size="sm"
                                                            onClick={() => handleDeleteSale(sale.id)}
                                                            borderRadius="md"
                                                        />
                                                    </Td>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardBody>
                </Card>
            </Container>
        </Box>
    );
}
