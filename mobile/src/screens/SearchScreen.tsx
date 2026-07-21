import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useProductSearch, useSearchSuggestions, usePopularSearches } from '@hooks/useProducts';
import ProductCard from '@components/ProductCard';
import LoadingSkeleton from '@components/LoadingSkeleton';
import EmptyState from '@components/EmptyState';

interface SearchScreenProps {
  locale?: string;
}

const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 10;

const SearchScreen: React.FC<SearchScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const rtl = isRTL(locale);

  const initialQuery = (route.params as any)?.query || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const { products, isLoading } = useProductSearch(debouncedQuery);
  const { suggestions } = useSearchSuggestions(query);
  const { searches: popularSearches } = usePopularSearches();

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveSearch = async (searchQuery: string) => {
    try {
      const updated = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const removeRecentSearch = async (search: string) => {
    try {
      const updated = recentSearches.filter((s) => s !== search);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear searches:', error);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setDebouncedQuery(searchQuery);
    setShowSuggestions(false);
    saveSearch(searchQuery);
    Keyboard.dismiss();
  };

  const handleProductPress = (id: string) => {
    navigation.navigate('ProductDetail', { productId: id });
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <ProductCard
      id={item.id}
      name={item.name}
      price={item.price}
      originalPrice={item.originalPrice}
      image={item.thumbnail || item.images[0]}
      rating={item.rating}
      reviewCount={item.reviewCount}
      onPress={handleProductPress}
      locale={locale}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
            placeholder="Search products, stores..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setShowSuggestions(true);
            }}
            onSubmitEditing={() => handleSearch(query)}
            autoFocus={!initialQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setShowSuggestions(true); }}>
              <Icon name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleSearch(query)}>
            <Icon name="magnify" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {debouncedQuery.length >= 2 && !showSuggestions ? (
        // Search Results
        isLoading ? (
          <LoadingSkeleton type="product" count={4} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="magnify-close"
            title="No results found"
            message={`We couldn't find anything for "${debouncedQuery}"`}
            actionLabel="Clear Search"
            onAction={() => { setQuery(''); setDebouncedQuery(''); }}
          />
        ) : (
          <FlatList
            data={products}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.resultsContainer}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        // Suggestions & Recent Searches
        <View style={styles.suggestionsContainer}>
          {/* Live Suggestions */}
          {query.length >= 2 && showSuggestions && suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                Suggestions
              </Text>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
                  onPress={() => handleSearch(suggestion)}
                >
                  <Icon name="magnify" size={18} color={colors.textMuted} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={[styles.sectionHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                  Recent Searches
                </Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.recentItem, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
                  onPress={() => handleSearch(search)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Icon name="clock-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.recentText}>{search}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeRecentSearch(search)}>
                    <Icon name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                Popular Searches
              </Text>
              <View style={[styles.popularContainer, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                {popularSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.popularChip}
                    onPress={() => handleSearch(search)}
                  >
                    <Text style={styles.popularChipText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  clearText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  recentText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  popularContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  popularChipText: {
    fontSize: 13,
    color: colors.text,
  },
  resultsContainer: {
    padding: 8,
    gap: 8,
  },
});

export default SearchScreen;
