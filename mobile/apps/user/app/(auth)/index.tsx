import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';

export default function AuthScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#470A68', '#8D14CE']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Image 
          source={require('../../assets/images/logosplash.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.heading}>Welcome to OnePost</Text>

        {/* Auth Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/(auth)/login-email')}
          >
            <Text style={styles.buttonText}>Login with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/(auth)/login-phone')}
          >
            <Text style={styles.buttonText}>Login with Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity>
            <Text style={styles.registerText}>
              New here? <Text style={styles.registerLink}>Register now</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#470A68',
  },
  registerText: {
    marginTop: 24,
    fontSize: 16,
    color: '#FFFFFF',
  },
  registerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 