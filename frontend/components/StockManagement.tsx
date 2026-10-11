import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { formatQuantity, formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  useToast,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  Spinner,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  TableContainer,
  Tooltip,
  InputGroup,
  InputLeftElement,
  Stack,
  Select,
} from '@chakra-ui/react';
import { MdEdit, MdDelete, MdAdd, MdWarning, MdInventory, MdTrendingUp, MdHistory, MdSave, MdCancel, MdSearch } from 'react-icons/md';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  cogs: number;
  threshold: number;
  categorie?: string;
  type?: 'ING' | 'PREP' | 'PRODUCT';
  unite?: string;
  image_url?: string;
}

// Helper to detect units based on name
const detectUnite = (nom: string): string => {
  const nomLower = nom.toLowerCase();
  if (nomLower.includes('huile') || nomLower.includes('eau') || nomLower.includes('lait') ||
    nomLower.includes('boisson') || nomLower.includes('soda') || nomLower.includes('jus') ||
    nomLower.includes('vinaigre') || nomLower.includes('sauce liquide')) {
    return 'L';
  }
  if (nomLower.includes('pain') || nomLower.includes('burger') || nomLower.includes('œuf') ||
    nomLower.includes('oeuf') || nomLower.includes('boite') || nomLower.includes('sachet') ||
    nomLower.includes('bouteille') || nomLower.includes('canette') || nomLower.includes('bun')) {
    return 'unité';
  }
  if (nomLower.includes('épice') || nomLower.includes('epice') || nomLower.includes('sel') ||
    nomLower.includes('poivre') || nomLower.includes('herbe') || nomLower.includes('levure') ||
    nomLower.includes('colorant') || nomLower.includes('arôme') || nomLower.includes('arome')) {
    return 'g';
  }
  return 'kg';
};

interface StockHistory {
  id: number | null;
  productId: string;
  isMain?: boolean;
  unit: string;
  stockQuantity: number | null;
  soldQuantity: number;
  remainingQuantity: number;
  type?: 'ING' | 'PREP' | 'PRODUCT';
}

interface StockPrediction {
  product_id: number;
  max_possible: number;
  limiting_ingredient: string | null;
  limiting_stock: number;
  limiting_required: number;
}

interface SaleTransaction {
  id: string;
  productId: number;
  productName: string;
  qtyStart: number;
  qtyIn: number;
  qtyOut: number;
  qtyEnd: number;
  dateTime: string;
  notes: string;
}

// Helper to play notification sound
const playAlertSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    // ignore audio autoplay policy errors
  }
};

// --- HYPER-SPEED OPTIMIZED COMPONENT ---
const ProductRow = memo(({
  product,
  editingId,
  handleEdit,
  handleSaveEdit,
  setEditingId,
  setEditingData,
  editingData,
  handleDelete,
  formatCurrency,
  formatQuantity
}: any) => {
  const isEditing = editingId === product.id;
  return (
    <Tr key={product.id} _hover={{ bg: "gray.50" }} transition="0.2s">
      <Td>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            boxSize="40px"
            borderRadius="lg"
            objectFit="cover"
            fallback={<Icon as={MdInventory} color="gray.300" />}
          />
        ) : (
          <Icon as={MdInventory} boxSize={5} color="gray.400" />
        )}
      </Td>
      <Td>
        {isEditing ? (
          <Input
            size="sm"
            value={editingData?.name}
            onChange={(e) => setEditingData({ ...editingData!, name: e.target.value })}
            fontWeight="bold"
          />
        ) : (
          <Text fontWeight="bold" color="var(--navy)">{product.name}</Text>
        )}
      </Td>
      <Td>
        <Badge size="xs" variant="solid" bg="var(--mauve)" color="white" px={2} borderRadius="full">
          {product.type}
        </Badge>
      </Td>
      <Td>
        {isEditing ? (
          <Input
            size="sm"
            type="number"
            value={editingData?.quantity}
            onChange={(e) => setEditingData({ ...editingData!, quantity: parseFloat(e.target.value) || 0 })}
          />
        ) : (
          <HStack>
            <Text fontWeight="black" color={product.quantity <= product.threshold ? "red.500" : "gray.700"}>
              {formatQuantity(product.quantity)}
            </Text>
            <Text fontSize="xs" color="gray.400">{product.unite}</Text>
            {product.quantity <= product.threshold && (
              <Tooltip label="Stock Faible">
                <span>
                  <Icon as={MdWarning} color="red.400" boxSize={3} />
                </span>
              </Tooltip>
            )}
          </HStack>
        )}
      </Td>
      <Td isNumeric>
        {isEditing ? (
          <Input
            size="sm"
            type="number"
            value={editingData?.price}
            onChange={(e) => setEditingData({ ...editingData!, price: parseFloat(e.target.value) || 0 })}
          />
        ) : (
          <Text fontWeight="bold">{formatCurrency(product.price)}</Text>
        )}
      </Td>
      <Td isNumeric fontWeight="black" color="var(--mauve)">
        {formatCurrency(product.price * product.quantity)}
      </Td>
      <Td textAlign="center">
        <HStack spacing={2} justify="center">
          {isEditing ? (
            <>
              <IconButton
                aria-label="Save"
                icon={<MdSave />}
                size="sm"
                colorScheme="green"
                onClick={handleSaveEdit}
              />
              <IconButton
                aria-label="Cancel"
                icon={<MdCancel />}
                size="sm"
                variant="ghost"
                onClick={() => { setEditingId(null); setEditingData(null); }}
              />
            </>
          ) : (
            <>
              <IconButton
                aria-label="Edit"
                icon={<MdEdit />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={() => handleEdit(product)}
              />
              <IconButton
                aria-label="Delete"
                icon={<MdDelete />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => handleDelete(product.id)}
              />
            </>
          )}
        </HStack>
      </Td>
    </Tr>
  );
}, (prev, next) => {
  return prev.product === next.product &&
    prev.editingId === next.editingId &&
    prev.editingData === next.editingData;
});

const StockManagement: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [historyStock, setHistoryStock] = useState<StockHistory[]>([]);
  const [stockVeilleData, setStockVeilleData] = useState<StockHistory[]>([]);
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newProduct, setNewProduct] = useState<Product>({
    id: '',
    name: '',
    quantity: 0,
    price: 0,
    cogs: 0,
    threshold: 0,
    type: 'ING',
    image_url: ''
  });

  const [dailyEntry, setDailyEntry] = useState({
    productId: '',
    qtyStart: 0,
    qtyIn: 0,
    qtyOut: 0,
    notes: ''
  });

  const checkAndNotifyLowStock = (mappedProducts: Product[]) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      // Only notify for ING items, as PRODUCT/PREP are calculated
      const lowStockItems = mappedProducts.filter(p => p.type === 'ING' && p.quantity <= p.threshold && p.quantity > 0);
      const outOfStockItems = mappedProducts.filter(p => p.type === 'ING' && p.quantity <= 0);

      let title = "";
      let body = "";

      if (outOfStockItems.length > 0) {
        title = "🚨 RUPTURE DE STOCK !";
        body = `Produits épuisés : ${outOfStockItems.map(i => i.name).join(', ')}`;
      } else if (lowStockItems.length > 0) {
        title = "⚠️ STOCK BAS";
        body = `Attention : ${lowStockItems.map(i => i.name).join(', ')} sous le seuil.`;
      }

      if (title) {
        // If background, use Service Worker
        if (document.visibilityState === 'hidden' && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body
          });
        } else {
          // If foreground, show normal notification
          new Notification(title, {
            body: body,
            icon: "/favicon.ico"
          });
        }
        playAlertSound();
      }
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
      const dateStr = format(viewDate, 'yyyy-MM-dd');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      let loadedFromLocal = false;

      if (isLocalhost) {
        try {
          const [dashRes, histRes, veilleRes, predRes] = await Promise.all([
            fetch('http://localhost:8000/dashboard-data', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:8000/stock-history-date/${dateStr}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:8000/stock-history-date/${yesterdayStr}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:8000/stock-prediction', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
          ]);

          if (dashRes.ok) {
            const data = await dashRes.json();
            const mappedProducts = (data.products || [])
              .map((p: any) => ({
                id: p.id.toString(),
                name: p.nom,
                quantity: p.quantite,
                price: p.cout_unitaire,
                cogs: (p.quantite || 0) * (p.cout_unitaire || 0),
                threshold: p.seuil,
                categorie: p.categorie,
                unite: p.unite || detectUnite(p.nom),
                type: p.type || (p.categorie === 'Main Product' ? 'PRODUCT' : 'ING'),
                image_url: p.image_url,
                recipe: p.recipe || {}
              } as any))
              .sort((a: any, b: any) => {
                const typeOrder = { 'PRODUCT': 1, 'PREP': 2, 'ING': 3 };
                const tA = typeOrder[a.type as keyof typeof typeOrder] || 99;
                const tB = typeOrder[b.type as keyof typeof typeOrder] || 99;
                if (tA !== tB) return tA - tB;
                return a.name.localeCompare(b.name);
              });
            setProducts(mappedProducts);
            checkAndNotifyLowStock(mappedProducts);

            if (histRes.ok) {
              const histData = await histRes.json();
              const entries = histData.entries || [];
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
              const mappedHistory = (data.products || [])
                .filter((p: any) => p.categorie === 'Ingredient' || p.type === 'ING' || p.type === 'PREP')
                .map((p: any) => {
                  const histEntry = entries.find((s: any) => s.product_id === p.id);
                  const fallbackQty = isToday ? (p.quantite || 0) : 0;
                  return {
                    id: histEntry ? histEntry.id : null,
                    productId: p.nom,
                    isMain: p.categorie !== "Ingredient",
                    unit: p.unite || detectUnite(p.nom),
                    stockQuantity: histEntry ? histEntry.qty_start : fallbackQty,
                    soldQuantity: histEntry ? histEntry.qty_out : 0,
                    remainingQuantity: histEntry ? histEntry.qty_end : fallbackQty
                  };
                });
              setHistoryStock(mappedHistory);
            }

            if (veilleRes && veilleRes.ok) {
              const veilleData = await veilleRes.json();
              const vEntries = veilleData.entries || [];
              const mappedVeille = (data.products || [])
                .filter((p: any) => p.categorie === 'Ingredient' || p.type === 'ING' || p.type === 'PREP')
                .map((p: any) => {
                  const vEntry = vEntries.find((s: any) => s.product_id === p.id);
                  return {
                    id: vEntry ? vEntry.id : null,
                    productId: p.nom,
                    unit: p.unite || detectUnite(p.nom),
                    stockQuantity: vEntry ? vEntry.qty_start : 0,
                    soldQuantity: vEntry ? vEntry.qty_out : 0,
                    remainingQuantity: vEntry ? vEntry.qty_end : 0,
                    type: p.type || (p.categorie === 'Main Product' ? 'PRODUCT' : 'ING')
                  };
                })
                .sort((a: any, b: any) => {
                  const typeOrder = { 'PRODUCT': 1, 'PREP': 2, 'ING': 3 };
                  const tA = typeOrder[a.type as keyof typeof typeOrder] || 99;
                  const tB = typeOrder[b.type as keyof typeof typeOrder] || 99;
                  if (tA !== tB) return tA - tB;
                  return a.productId.localeCompare(b.productId);
                });
              setStockVeilleData(mappedVeille as any);
            }

            if (predRes && predRes.ok) {
              const predData = await predRes.json();
              setPredictions(predData);
            }

            loadedFromLocal = true;
          } else if (dashRes.status === 401) {
            localStorage.removeItem('access_token');
            router.push('/login');
            return;
          }
        } catch (localErr) {
          console.warn('Local backend not reachable, using Supabase fallback:', localErr);
        }
      }

      // Supabase Cloud Fallback (on Vercel or when local backend is down)
      if (!loadedFromLocal) {
        const { data: sbProducts } = await supabase.from('products').select('*');
        const { data: sbRecipes } = await supabase.from('recipes').select('*');

        if (sbProducts && sbProducts.length > 0) {
          const recipesMap: Record<number, Record<number, number>> = {};
          (sbRecipes || []).forEach((r: any) => {
            if (!recipesMap[r.product_id]) recipesMap[r.product_id] = {};
            recipesMap[r.product_id][r.ingredient_id] = r.quantity;
          });

          const mappedProducts = sbProducts
            .map((p: any) => ({
              id: p.id.toString(),
              name: p.nom,
              quantity: p.quantite || 0,
              price: p.cout_unitaire || 0,
              cogs: (p.quantite || 0) * (p.cout_unitaire || 0),
              threshold: p.seuil || 10,
              categorie: p.categorie,
              unite: p.unite || detectUnite(p.nom),
              type: p.type || (p.categorie === 'Main Product' ? 'PRODUCT' : 'ING'),
              image_url: p.image_url || '',
              recipe: recipesMap[p.id] || {}
            } as any))
            .sort((a: any, b: any) => {
              const typeOrder = { 'PRODUCT': 1, 'PREP': 2, 'ING': 3 };
              const tA = typeOrder[a.type as keyof typeof typeOrder] || 99;
              const tB = typeOrder[b.type as keyof typeof typeOrder] || 99;
              if (tA !== tB) return tA - tB;
              return a.name.localeCompare(b.name);
            });

          setProducts(mappedProducts);
          checkAndNotifyLowStock(mappedProducts);

          const mappedHistory = sbProducts
            .filter((p: any) => p.categorie === 'Ingredient' || p.type === 'ING' || p.type === 'PREP')
            .map((p: any) => ({
              id: p.id,
              productId: p.nom,
              isMain: p.categorie !== "Ingredient",
              unit: p.unite || detectUnite(p.nom),
              stockQuantity: p.quantite || 0,
              soldQuantity: 0,
              remainingQuantity: p.quantite || 0
            }));
          setHistoryStock(mappedHistory);

          const mappedVeille = sbProducts
            .filter((p: any) => p.categorie === 'Ingredient' || p.type === 'ING' || p.type === 'PREP')
            .map((p: any) => ({
              id: p.id,
              productId: p.nom,
              unit: p.unite || detectUnite(p.nom),
              stockQuantity: p.quantite || 0,
              soldQuantity: 0,
              remainingQuantity: p.quantite || 0,
              type: p.type || (p.categorie === 'Main Product' ? 'PRODUCT' : 'ING')
            }))
            .sort((a: any, b: any) => {
              const typeOrder = { 'PRODUCT': 1, 'PREP': 2, 'ING': 3 };
              const tA = typeOrder[a.type as keyof typeof typeOrder] || 99;
              const tB = typeOrder[b.type as keyof typeof typeOrder] || 99;
              if (tA !== tB) return tA - tB;
              return a.productId.localeCompare(b.productId);
            });
          setStockVeilleData(mappedVeille as any);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('SW Registered', reg))
        .catch(err => console.error('SW Failed', err));
    }

    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    fetchData();
  }, [viewDate]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;

    const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
    try {
      if (isLocalhost) {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/add-product', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nom: newProduct.name,
            quantite: newProduct.quantity,
            cout_unitaire: newProduct.price,
            seuil: newProduct.threshold,
            categorie: newProduct.type === 'PRODUCT' ? 'Main Product' : 'Ingredient',
            type: newProduct.type,
            image_url: newProduct.image_url
          }),
        });

        if (response.ok) {
          fetchData();
          setNewProduct({ id: '', name: '', quantity: 0, price: 0, cogs: 0, threshold: 0, type: 'ING', image_url: '' });
          toast({ title: 'Produit ajouté', status: 'success', duration: 3000 });
          return;
        }
      }

      // Supabase insertion
      const { error } = await supabase.from('products').insert([{
        nom: newProduct.name,
        quantite: newProduct.quantity,
        cout_unitaire: newProduct.price,
        seuil: newProduct.threshold,
        categorie: newProduct.type === 'PRODUCT' ? 'Main Product' : 'Ingredient',
        type: newProduct.type,
        image_url: newProduct.image_url
      }]);

      if (!error) {
        fetchData();
        setNewProduct({ id: '', name: '', quantity: 0, price: 0, cogs: 0, threshold: 0, type: 'ING', image_url: '' });
        toast({ title: 'Produit ajouté', status: 'success', duration: 3000 });
      } else {
        toast({ title: 'Erreur: ' + error.message, status: 'error', duration: 3000 });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
    try {
      if (isLocalhost) {
        const token = localStorage.getItem('access_token');
        await fetch(`http://localhost:8000/delete-product/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);
      }
      await supabase.from('products').delete().eq('id', parseInt(id));
      setProducts(prev => prev.filter(product => product.id !== id));
      toast({ title: 'Produit supprimé', status: 'info', duration: 3000 });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setEditingData({ ...product });
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
    try {
      const newCategory = editingData.type === 'PRODUCT' ? 'Main Product' : 'Ingredient';

      if (isLocalhost) {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`http://localhost:8000/update-product/${editingData.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nom: editingData.name,
              quantite: editingData.quantity,
              cout_unitaire: editingData.price,
              seuil: editingData.threshold,
              categorie: newCategory,
              type: editingData.type,
              image_url: editingData.image_url
            }),
          });

          if (response.ok) {
            const originalProduct = products.find(p => p.id === editingData.id);
            if (originalProduct && originalProduct.quantity !== editingData.quantity && editingData.type === 'ING') {
              const qtyDiff = editingData.quantity - originalProduct.quantity;
              await fetch('http://localhost:8000/stock-daily-entry', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  product_id: parseInt(editingData.id),
                  qty_start: originalProduct.quantity,
                  qty_in: qtyDiff > 0 ? qtyDiff : 0,
                  qty_out: qtyDiff < 0 ? Math.abs(qtyDiff) : 0,
                  notes: `Modification manuelle: ${originalProduct.quantity} → ${editingData.quantity}`
                })
              }).catch(() => null);
            }
          }
        } catch (e) {
          console.warn('Local update skipped:', e);
        }
      }

      // Update in Supabase
      await supabase.from('products').update({
        nom: editingData.name,
        quantite: editingData.quantity,
        cout_unitaire: editingData.price,
        seuil: editingData.threshold,
        categorie: newCategory,
        type: editingData.type,
        image_url: editingData.image_url
      }).eq('id', parseInt(editingData.id));

      setProducts(prev => prev.map(p => p.id === editingData.id ? editingData : p));
      setEditingId(null);
      setEditingData(null);
      toast({ title: 'Modification enregistrée', status: 'success', duration: 3000 });
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  // --- HYPER-SPEED MEMOIZED FILTERS ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (product.type === 'PRODUCT') return false;
      const search = searchTerm.toLowerCase();
      const name = (product.name || "").toLowerCase();
      return name.includes(search);
    });
  }, [products, searchTerm]);

  if (loading) {
    return (
      <Flex p={20} justify="center" align="center" direction="column" gap={4}>
        <Spinner size="xl" color="var(--mauve)" thickness="4px" />
        <Text fontWeight="bold" color="var(--navy)">Chargement du stock...</Text>
      </Flex>
    );
  }

  return (
    <Box p={{ base: 2, md: 6 }}>
      {/* HEADER & ADD QUICK */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <HStack>
          <Icon as={MdInventory} boxSize={7} color="var(--navy)" />
          <Heading size="lg" color="var(--navy)" fontWeight="900" letterSpacing="tight">GESTION STOCK</Heading>
        </HStack>

        <Button
          leftIcon={<MdAdd />}
          bg="var(--mauve)"
          color="white"
          _hover={{ bg: "#6a5acd", transform: 'translateY(-2px)' }}
          px={6}
          onClick={() => document.getElementById('add-form')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Nouveau Produit
        </Button>
      </Flex>

      {/* FILTER SEARCH */}
      <Box mb={6} bg="white" p={4} borderRadius="xl" boxShadow="sm">
        <InputGroup>
          <InputLeftElement pointerEvents="none"><Icon as={MdSearch} color="gray.400" /></InputLeftElement>
          <Input
            placeholder="Rechercher un produit ou ingrédient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </Box>

      {/* TABLES SECTION */}
      <VStack spacing={8} align="stretch" pb={10}>

        {/* TABLE 1: STOCK DU VEILLE (J-1) */}
        <Box>
          <HStack mb={4} justify="space-between">
            <Heading size="md" color="gray.600">Tableau Stock du Veille (J-1)</Heading>
            <Badge colorScheme="blue" variant="outline">Date: {viewDate.toLocaleDateString()}</Badge>
          </HStack>
          <Card borderRadius="xl" boxShadow="md" overflow="hidden" bg="white">
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>Ingrédient (ING)</Th>
                    <Th isNumeric>Quantité fin de journée (Restante)</Th>
                    <Th>Unité</Th>
                    <Th>Seuil critique</Th>
                    <Th>Statut</Th>
                    <Th>Commentaire</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stockVeilleData
                    .filter(item => item.productId.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item, idx) => {
                      // Find actual product to get its real-time threshold
                      const product = products.find(p => p.name === item.productId);
                      const threshold = product ? product.threshold : 10;

                      let statusIcon = "✅";
                      let statusText = "OK";
                      let statusColor = "green";
                      let comment = "Stock suffisant";

                      if (item.remainingQuantity <= 0) {
                        statusIcon = "❌";
                        statusText = "CRITICAL";
                        statusColor = "red";
                        comment = `Rupture de ${item.productId} !`;
                      } else if (item.remainingQuantity <= threshold) {
                        statusIcon = "⚠️";
                        statusText = "LOW";
                        statusColor = "orange";
                        comment = `Commander ${item.productId} demain`;
                      } else {
                        comment = `Suffisant pour ${item.productId} J+1`;
                      }

                      return (
                        <Tr key={idx} _hover={{ bg: "gray.50" }}>
                          <Td fontWeight="bold" color="gray.800">{item.productId}</Td>
                          <Td isNumeric fontWeight="extrabold">{formatQuantity(item.remainingQuantity)}</Td>
                          <Td>{item.unit}</Td>
                          <Td>{formatQuantity(threshold)}</Td>
                          <Td>
                            <Badge colorScheme={statusColor} variant="solid" borderRadius="full" px={2}>
                              {statusIcon} {statusText}
                            </Badge>
                          </Td>
                          <Td fontSize="xs" fontWeight="500" color="gray.600">{comment}</Td>
                        </Tr>
                      );
                    })}
                  {stockVeilleData.length === 0 && (
                    <Tr><Td colSpan={6} textAlign="center" py={10} color="gray.400">Aucune donnée de stock pour hier.</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
        </Box>

        {/* TABLE 2: GESTION STOCK & PRODUCTION (AUJOURD'HUI) */}
        <Box>
          <Heading size="md" mb={4} color="blue.700">Tableau Gestion Stock & Production (Aujourd'hui)</Heading>
          <Card borderRadius="xl" boxShadow="lg" overflow="hidden" bg="white">
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead bg="var(--navy)">
                  <Tr>
                    <Th w="60px"></Th>
                    <Th color="white">Item</Th>
                    <Th color="white">Type</Th>
                    <Th color="white">Stock Réel</Th>
                    <Th isNumeric color="white">Prix (DT)</Th>
                    <Th isNumeric color="white">Valeur</Th>
                    <Th textAlign="center" color="white">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredProducts.map(product => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      editingId={editingId}
                      handleEdit={handleEditProduct}
                      handleSaveEdit={handleSaveEdit}
                      setEditingId={setEditingId}
                      setEditingData={setEditingData}
                      editingData={editingData}
                      handleDelete={handleDeleteProduct}
                      formatCurrency={formatCurrency}
                      formatQuantity={formatQuantity}
                    />
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      </VStack>

      {/* QUICK ADD SECTION */}
      <Box id="add-form" mt={10} p={6} bg="white" borderRadius="xl" border="1px solid" borderColor="var(--navy)" boxShadow="lg">
        <Heading size="sm" mb={6} color="var(--navy)" textTransform="uppercase" letterSpacing="widest">Ajouter un nouveau produit</Heading>
        <Stack as="form" onSubmit={handleAddProduct} direction={{ base: "column", md: "row" }} spacing={4} align="end">
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="bold">Nom</FormLabel>
            <Input bg="gray.50" placeholder="Nom du produit" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" fontWeight="bold">Type</FormLabel>
            <Select bg="gray.50" value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value as any })}>
              <option value="ING">ING</option>
              <option value="PREP">PREP</option>
              <option value="PRODUCT">PRODUCT</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" fontWeight="bold">Quantité Initiale</FormLabel>
            <Input bg="gray.50" type="number" placeholder="0" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: parseFloat(e.target.value) })} />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" fontWeight="bold">Seuil</FormLabel>
            <Input bg="gray.50" type="number" placeholder="10" value={newProduct.threshold} onChange={e => setNewProduct({ ...newProduct, threshold: parseFloat(e.target.value) })} />
          </FormControl>
          <Button
            bg="var(--mauve)"
            color="white"
            type="submit"
            px={10}
            borderRadius="0"
            _hover={{ bg: "var(--navy)", transform: 'translateY(-2px)' }}
          >
            AJOUTER
          </Button>
        </Stack>
      </Box>

    </Box>
  );
};

export default StockManagement;
