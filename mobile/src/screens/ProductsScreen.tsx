import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useProducts } from '@hooks/useProducts';
import ProductCard from '@components/ProductCard';
import LoadingSkeleton from '@components/LoadingSkeleton';
import EmptyState from '@components/EmptyState';

const { width } = Dimensions.get('window');

type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
type ViewMode = 'grid' | 'list';

interface ProductsScreenProps {
  locale?: string;
}

const sortOptions: { key: SortOption; label: string; icon: string }[] = [
  { key: 'popular', label: 'Most Popular', icon: 'trending-up' },
  { key: 'newest', label: 'Newest', icon: 'clock-outline' },
  { key: 'price_asc', label: 'Price: Low to High', icon: 'arrow-up' },
  { key: 'price_desc', label: 'Price: High to Low', icon: 'arrow-down' },
  { key: 'rating', label: 'Highest Rated', icon: 'star-outline' },
];

const ProductsScreen: React.FC<ProductsScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const rtl = isRTL(locale);

  const { categoryId, categoryName, search: searchParam } = route.params as any;

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParam || '');

  const filters = {
    categoryId,
    sortBy,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    rating: selectedRating || undefined,
    search: searchQuery || undefined,
  };

  const {
    products,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useProducts(filters);

  const handleProductPress = (id: string) => {
    navigation.navigate('ProductDetail', { productId: id });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    refetch();
  };

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating(0);
  };

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                sortBy === option.key && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortBy(option.key);
                setShowSortModal(false);
              }}
            >
              <Icon
                name={option.icon}
                size={20}
                color={sortBy === option.key ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Icon name="check" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range (OMR)</Text>
              <View style={[styles.priceInputs, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            {/* Rating */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={[styles.ratingOptions, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingChip,
                      selectedRating === rating && styles.ratingChipActive,
                    ]}
                    onPress={() =>
                      setSelectedRating(selectedRating === rating ? 0 : rating)
                    }
                  >
                    {rating > 0 && (
                      <Icon name="star" size={14} color={colors.secondary} />
                    )}
                    <Text
                      style={[
                        styles.ratingChipText,
                        selectedRating === rating && styles.ratingChipTextActive,
                      ]}
                    >
                      {rating === 0 ? 'All' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Filter Actions */}
          <View style={[styles.filterActions, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {categoryName || 'Products'}
          </Text>
        </View>
        <LoadingSkeleton type="product" count={6} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName || 'Products'}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.resultCount}>
            <Text style={styles.resultCountText}>
              {products.length} results
            </Text>
          </View>
          <View style={styles.toolbarActions}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowSortModal(true)}
            >
              <Icon name="sort-variant" size={20} color={colors.text} />
              <Text style={styles.toolbarButtonText}>Sort</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Icon name="filter-outline" size={20} color={colors.text} />
              <Text style={styles.toolbarButtonText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Icon
                name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Products List */}
      {products.length === 0 ? (
        <EmptyState
          icon="package-variant"
          title="No products found"
          message="Try adjusting your filters or search query"
          actionLabel="Clear Filters"
          onAction={() => {
            resetFilters();
            setSearchQuery('');
            refetch();
          }}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              id={item.id}
              name={item.name}
              price={item.price}
              originalPrice={item.originalPrice}
              image={item.thumbnail || item.images[0]}
              rating={item.rating}
              reviewCount={item.reviewCount}
              isNew={item.isNew}
              discount={item.discount}
              freeShipping={item.freeShipping}
              onPress={handleProductPress}
              locale={locale}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={[
            styles.productsContainer,
            viewMode === 'list' && styles.productsList,
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadMore}>
                <LoadingSkeleton type="product" count={2} />
              </View>
            ) : null
          }
        />
      )}

      {renderSortModal()}
      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    flex: 1,
  },
  resultCountText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    marginLeft: 6,
    gap: 4,
  },
  toolbarButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  productsContainer: {
    padding: 8,
    gap: 8,
  },
  productsList: {
    padding: 16,
  },
  loadMore: {
    paddingVertical: 16,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: `${colors.primary}10`,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Filters
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  priceSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  ratingChipActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  ratingChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  ratingChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

export default ProductsScreen;
