import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useCategories } from '@hooks/useProducts';
import LoadingSkeleton from '@components/LoadingSkeleton';
import EmptyState from '@components/EmptyState';

interface CategoriesScreenProps {
  locale?: string;
}

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  locale = 'en',
}) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { categories, isLoading, isError } = useCategories();

  const filteredCategories = searchQuery
    ? categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.children?.some((child) =>
            child.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : categories;

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('Products', { categoryId, categoryName });
  };

  const handleSubcategoryPress = (subcategoryId: string, name: string) => {
    navigation.navigate('Products', { categoryId: subcategoryId, categoryName: name });
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    const isExpanded = expandedCategory === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryRow,
            isExpanded && styles.categoryRowActive,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
          onPress={() =>
            hasChildren
              ? toggleCategory(item.id)
              : handleCategoryPress(item.id, item.name)
          }
        >
          <View
            style={[
              styles.categoryIcon,
              { flexDirection: rtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={styles.iconCircle}>
              <Icon
                name={item.icon || 'shape-outline'}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.categoryInfo}>
              <Text
                style={[
                  styles.categoryName,
                  { textAlign: rtl ? 'right' : 'left' },
                ]}
              >
                {item.name}
              </Text>
              <Text style={styles.categoryCount}>
                {item.productCount} products
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
            {item.productCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{item.productCount}</Text>
              </View>
            )}
            {hasChildren && (
              <Icon
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
                style={{ marginLeft: rtl ? 0 : 4, marginRight: rtl ? 4 : 0 }}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Subcategories */}
        {isExpanded && hasChildren && (
          <View style={[styles.subcategoriesList, rtl && styles.subcategoriesListRTL]}>
            {item.children.map((child: any) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.subcategoryItem,
                  { flexDirection: rtl ? 'row-reverse' : 'row' },
                ]}
                onPress={() => handleSubcategoryPress(child.id, child.name)}
              >
                <View style={styles.subcategoryLine} />
                <Icon
                  name="subdirectory-arrow-right"
                  size={16}
                  color={colors.textMuted}
                  style={{
                    transform: [{ scaleX: rtl ? -1 : 1 }],
                  }}
                />
                <Text
                  style={[
                    styles.subcategoryName,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                >
                  {child.name}
                </Text>
                <View style={styles.subcategoryCountBadge}>
                  <Text style={styles.subcategoryCountText}>
                    {child.productCount}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Categories</Text>
        </View>
        <LoadingSkeleton type="list" count={8} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Failed to load categories"
          message="Please try again later"
          actionLabel="Retry"
          onAction={() => {}}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={[
            styles.searchInput,
            { textAlign: rtl ? 'right' : 'left' },
          ]}
          placeholder="Search categories..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon="shape-outline"
          title="No categories found"
          message={
            searchQuery
              ? 'Try adjusting your search'
              : 'Categories will appear here'
          }
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  categoryContainer: {
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  categoryRowActive: {
    backgroundColor: `${colors.primary}08`,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  categoryIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  subcategoriesList: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 2,
  },
  subcategoriesListRTL: {
    // RTL styles
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  subcategoryLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginRight: 8,
    borderRadius: 1,
  },
  subcategoryName: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  subcategoryCountBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  subcategoryCountText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default CategoriesScreen;
