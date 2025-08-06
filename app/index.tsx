import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

// Definición de tipos
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ApiResponse {
  message: {
    content: string;
  };
}

export default function App(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async (): Promise<void> => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3',
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudo enviar el mensaje. Verifica que Ollama esté ejecutándose en localhost:11434',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = (): void => {
    Alert.alert(
      'Limpiar chat',
      '¿Estás seguro de que quieres eliminar todos los mensajes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí', onPress: () => setMessages([]) },
      ]
    );
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (msg: Message, index: number): JSX.Element => (
    <View key={index} style={[
      styles.messageContainer,
      msg.role === 'user' ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        msg.role === 'user' ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          msg.role === 'user' ? styles.userText : styles.botText
        ]}>
          {msg.content}
        </Text>
        <Text style={[
          styles.timestamp,
          msg.role === 'user' ? styles.userTimestamp : styles.botTimestamp
        ]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KarXZ Chat con Llama3</Text>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        {/* Chat área */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                👋 ¡Hola! Envía un mensaje para comenzar a chatear con Llama3🦙
              </Text>
            </View>
          ) : (
            messages.map((msg, index) => renderMessage(msg, index))
          )}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#192F8FFF" />
              <Text style={styles.loadingText}>Escribiendo...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input área */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (input.trim() === '' || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={input.trim() === '' || isLoading}
          >
            <Text style={[
              styles.sendButtonText,
              (input.trim() === '' || isLoading) && styles.sendButtonTextDisabled
            ]}>
              {isLoading ? '⏳' : '📤'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundImage: 'linear-gradient(to bottom, #387233FF, #386899FF)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#0A0A0AFF',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'georgia',
    color: '#000000FF',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dc3545',
    borderRadius: 15,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chat: {
    flex: 1,
    paddingHorizontal: 15,
  },
  chatContent: {
    paddingVertical: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#F6F7F8FF',
    textAlign: 'center',
    lineHeight: 24,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#212529',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#6c757d',
    textAlign: 'left',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F3F9FFFF',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#0B0B0CFF',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FDFDFDFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#FFFFFFFF',
  },
  sendButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00FF37FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ced4da',
  },
  sendButtonText: {
    fontSize: 18,
  },
  sendButtonTextDisabled: {
    opacity: 0.5,
  },
});