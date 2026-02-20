import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Flex,
    Spinner,
    Badge,
    Heading,
    useColorModeValue,
    Icon,
    Collapse,
    IconButton
} from '@chakra-ui/react';
import { MdExpandMore, MdExpandLess, MdBarChart } from 'react-icons/md';
import { formatQuantity, formatCurrency } from '../utils/formatters';

interface ConsumptionData {
    product_id: number;
    product_name: string;
    unite: string;
    product_type: string;
    price: number;
    period_label: string;
    total_consumed: number;
    total_cost: number;
}

export default function ConsumptionAnalytics() {
    const [isOpen, setIsOpen] = useState(false);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ConsumptionData[]>([]);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        if (isOpen) {
            fetchConsumptionData();
        }
    }, [period, isOpen]);

    const fetchConsumptionData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/analytics/consumption?period=${period}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const result = await response.json();
                setData(result.data || []);
            } else {
                console.error('Failed to fetch consumption data');
            }
        } catch (error) {
            console.error('Error fetching consumption data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group data by period
    const groupedData = data.reduce((acc, item) => {
        const period = item.period_label;
        if (!acc[period]) {
            acc[period] = [];
        }
        acc[period].push(item);
        return acc;
    }, {} as Record<string, ConsumptionData[]>);

    const periods = Object.keys(groupedData).sort().reverse();

    const getPeriodLabel = (periodKey: string) => {
        if (period === 'daily') return periodKey;
        if (period === 'weekly') return `Semaine ${periodKey}`;
        if (period === 'monthly') {
            const [year, month] = periodKey.split('-');
            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        }
        return periodKey;
    };

    return (
        <Box mb={6} borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={bgColor} overflow="hidden">
            {/* Header */}
            <Flex
                p={4}
                justify="space-between"
                align="center"
                cursor="pointer"
                onClick={() => setIsOpen(!isOpen)}
                bg={useColorModeValue('blue.50', 'blue.900')}
                _hover={{ bg: useColorModeValue('blue.100', 'blue.800') }}
            >
                <Flex align="center" gap={3}>
                    <Icon as={MdBarChart} boxSize={6} color="blue.500" />
                    <Heading size="md">📊 Consommation</Heading>
                </Flex>
                <IconButton
                    aria-label="Toggle consumption"
                    icon={isOpen ? <MdExpandLess /> : <MdExpandMore />}
                    variant="ghost"
                    size="sm"
                />
            </Flex>

            {/* Content */}
            <Collapse in={isOpen} animateOpacity>
                <Box p={6}>
                    {/* Period Selector */}
                    <Flex mb={6} justify="space-between" align="center" flexWrap="wrap" gap={4}>
                        <ButtonGroup size="md" isAttached variant="outline">
                            <Button
                                colorScheme={period === 'daily' ? 'blue' : 'gray'}
                                onClick={() => setPeriod('daily')}
                            >
                                Par Jour
                            </Button>
                            <Button
                                colorScheme={period === 'weekly' ? 'blue' : 'gray'}
                                onClick={() => setPeriod('weekly')}
                            >
                                Hebdo
                            </Button>
                            <Button
                                colorScheme={period === 'monthly' ? 'blue' : 'gray'}
                                onClick={() => setPeriod('monthly')}
                            >
                                Mensuel
                            </Button>
                        </ButtonGroup>

                        <Badge colorScheme="blue" fontSize="sm" p={2}>
                            {data.length} entrées
                        </Badge>
                    </Flex>

                    {/* Loading State */}
                    {loading && (
                        <Flex justify="center" align="center" py={10}>
                            <Spinner size="xl" color="blue.500" thickness="4px" />
                        </Flex>
                    )}

                    {/* Data Display */}
                    {!loading && data.length === 0 && (
                        <Text textAlign="center" color="gray.500" py={10}>
                            Aucune donnée de consommation pour cette période
                        </Text>
                    )}

                    {!loading && data.length > 0 && (
                        <Box overflowX="auto">
                            {periods.map((periodKey) => {
                                const periodItems = groupedData[periodKey];
                                const totalCost = periodItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);

                                return (
                                    <Box key={periodKey} mb={6}>
                                        <Flex justify="space-between" align="center" mb={3}>
                                            <Heading size="sm" color="blue.600">
                                                {getPeriodLabel(periodKey)}
                                            </Heading>
                                            <Badge colorScheme="green" fontSize="md" p={2}>
                                                Total: {formatCurrency(totalCost)}
                                            </Badge>
                                        </Flex>

                                        <Table variant="simple" size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Produit</Th>
                                                    <Th>Type</Th>
                                                    <Th isNumeric>Quantité Consommée</Th>
                                                    <Th>Unité</Th>
                                                    <Th isNumeric>Coût</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {periodItems.map((item, idx) => (
                                                    <Tr key={idx} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                                                        <Td fontWeight="medium">{item.product_name}</Td>
                                                        <Td>
                                                            <Badge
                                                                colorScheme={
                                                                    item.product_type === 'ING' ? 'orange' :
                                                                        item.product_type === 'PREP' ? 'cyan' : 'gray'
                                                                }
                                                            >
                                                                {item.product_type}
                                                            </Badge>
                                                        </Td>
                                                        <Td isNumeric fontWeight="bold">
                                                            {formatQuantity(item.total_consumed)}
                                                        </Td>
                                                        <Td>{item.unite}</Td>
                                                        <Td isNumeric color="green.600" fontWeight="medium">
                                                            {formatCurrency(item.total_cost || 0)}
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
}
