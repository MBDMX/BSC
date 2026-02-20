import requests
import time

# Attendre que le serveur démarre
time.sleep(2)

# Test de connexion avec 'dymeh' et 'admin'
data = {'username': 'dymeh', 'password': 'admin'}
try:
    response = requests.post('http://localhost:8000/token', data=data, timeout=5)
    print('Status Code:', response.status_code)
    if response.status_code == 200:
        print('✅ Connexion réussie!')
        print('Token:', response.json().get('access_token')[:50] + '...')
    else:
        print('❌ Échec de connexion')
        print('Response:', response.text)
except Exception as e:
    print('Erreur:', str(e))