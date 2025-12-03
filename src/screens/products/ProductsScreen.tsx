import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const products = [
  {
    id: 1,
    name: 'CMU TalentHub',
    description: 'A comprehensive mobile application that connects CMU students with job opportunities, showcases their talents, and facilitates networking within the university community.',
    features: ['Job Postings', 'Talent Showcase', 'Student Networking', 'Mobile-First Design'],
    status: 'Active',
    icon: 'phone-portrait',
    color: '#8F1A27',
    images: ['icon.png', 'adaptive-icon.png', 'splash.png'],
  },
  {
    id: 2,
    name: 'CMU Perks',
    description: 'We\'re dedicated to helping Central Michigan University students discover and utilize all the amazing resources, software, and services available to them. No more missing out on valuable benefits you\'re already paying for.',
    features: ['Resource Discovery', 'Software Access', 'Student Benefits', 'Cost Savings'],
    status: 'Active',
    icon: 'people',
    color: '#FFC540',
    images: ['perks-1', 'perks-2', 'perks-3', 'perks-4'],
  },
  {
    id: 3,
    name: 'CMU Offcampus Housing',
    description: 'Our mission is to simplify the off-campus housing search for Central Michigan University students. We understand that finding the right place to live is a crucial part of the college experience, and we\'re dedicated to making that process as smooth as possible.',
    features: ['Housing Search', 'Property Listings', 'Student Reviews', 'Rental Assistance'],
    status: 'Active',
    icon: 'home',
    color: '#6A0032',
    images: ['housing-1', 'housing-2', 'housing-3', 'housing-4'],
  },
  {
    id: 4,
    name: 'Slate Student Documentation',
    description: 'Your comprehensive resource for tutorials, guides, and support to help CMU students and faculty navigate the college admissions process with confidence.',
    features: ['Documentation', 'Tutorials', 'Admissions Guide', 'Faculty Support'],
    status: 'Active',
    icon: 'library',
    color: '#8F1A27',
    images: ['slate-1', 'slate-2', 'slate-3', 'slate-4', 'slate-5'],
  }
];

const ProductsScreen: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});

  // Auto-advance images
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    products.forEach((product) => {
      const interval = setInterval(() => {
        if (isPlaying[product.id]) {
          setCurrentImageIndex(prev => ({
            ...prev,
            [product.id]: (prev[product.id] || 0 + 1) % product.images.length
          }));
        }
      }, 3000);
      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [isPlaying]);

  const nextImage = (productId: number, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0 + 1) % totalImages
    }));
  };

  const prevImage = (productId: number, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: prev[productId] === 0 ? totalImages - 1 : (prev[productId] || 0) - 1
    }));
  };

  const togglePlay = (productId: number) => {
    setIsPlaying(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleVisitProduct = (productName: string) => {
    // In a real app, this would open the specific product URL
    console.log(`Visiting ${productName}`);
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:contact@cmutalenthub.com');
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Our Products & Services</Text>
            <Text style={styles.subtitle}>
              Discover our comprehensive suite of tools and services designed to enhance the CMU student experience.
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Add any action buttons here if needed */}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Products Grid */}
        <View style={styles.productsContainer}>
          {products.map((product) => {
            const currentIndex = currentImageIndex[product.id] || 0;
            const isProductPlaying = isPlaying[product.id] || false;

            return (
              <Card key={product.id} style={styles.productCard}>
                <CardHeader style={styles.cardHeader}>
                  <View style={styles.productHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: product.color }]}>
                      <Ionicons name={product.icon as any} size={24} color="white" />
                    </View>
                    <View style={styles.productInfo}>
                      <CardTitle style={styles.productTitle}>{product.name}</CardTitle>
                      <Badge style={styles.statusBadge}>
                        <Text style={styles.statusText}>{product.status}</Text>
                      </Badge>
                    </View>
                  </View>
                </CardHeader>
                
                {/* Media Slider */}
                <View style={styles.mediaContainer}>
                  {product.id === 1 ? (
                    // For mobile app, show actual images
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: `asset:/${product.images[currentIndex]}` }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    // For other products, show placeholder until images are added
                    <View style={styles.mediaPlaceholder}>
                      <View style={[styles.placeholderIcon, { backgroundColor: product.color }]}>
                        <Ionicons name={product.icon as any} size={32} color="white" />
                      </View>
                      <Text style={styles.placeholderText}>Product Screenshots</Text>
                      <Text style={styles.placeholderSubtext}>Coming Soon</Text>
                    </View>
                  )}
                  
                  {/* Navigation Controls */}
                  <View style={styles.navigationControls}>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => prevImage(product.id, product.images.length)}
                    >
                      <Ionicons name="chevron-back" size={20} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => nextImage(product.id, product.images.length)}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Play/Pause Control */}
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => togglePlay(product.id)}
                  >
                    <Ionicons 
                      name={isProductPlaying ? "pause" : "play"} 
                      size={16} 
                      color="#666" 
                    />
                  </TouchableOpacity>

                  {/* Image Indicators */}
                  <View style={styles.indicators}>
                    {product.images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentIndex ? styles.activeIndicator : styles.inactiveIndicator
                        ]}
                      />
                    ))}
                  </View>
                </View>
                
                <CardContent style={styles.cardContent}>
                  <Text style={styles.description}>{product.description}</Text>
                  
                  <View style={styles.featuresSection}>
                    <Text style={styles.featuresTitle}>Key Features:</Text>
                    <View style={styles.featuresContainer}>
                      {product.features.map((feature, index) => (
                        <Badge key={index} style={styles.featureBadge}>
                          <Text style={styles.featureText}>{feature}</Text>
                        </Badge>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <Button 
                      style={[styles.visitButton, { borderColor: product.color }]}
                      onPress={() => handleVisitProduct(product.name)}
                    >
                      <Ionicons name="open-outline" size={16} color={product.color} />
                      <Text style={[styles.buttonText, { color: product.color }]}>Visit</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaSubtitle}>
            Explore our products and discover how we're enhancing the CMU student experience.
          </Text>
          <View style={styles.ctaButtons}>
            <Button style={styles.contactButton} onPress={handleContactUs}>
              <Ionicons name="mail-outline" size={16} color="white" />
              <Text style={styles.contactButtonText}>Contact Us</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    paddingTop: 35,
    paddingBottom: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 0,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  productsContainer: {
    padding: 16,
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  mediaContainer: {
    height: 200,
    backgroundColor: '#f3f4f6',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mediaPlaceholder: {
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  navigationControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  indicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  inactiveIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardContent: {
    paddingTop: 8,
  },
  description: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresSection: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  ctaSection: {
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    marginTop: 16,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    maxWidth: width * 0.8,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#8F1A27',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProductsScreen; 