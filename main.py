from flask import Flask, jsonify,request,render_template
import json,os #json para archivos json y os para archivos de sistema


DATA_FILE = 'users.json' # importa el archivo users.json con el que trabajare

app = Flask(__name__) #crea la aplicacion

#ejemplo
@app.route ('/')
def root():
    return 'Hello World'

#validar, aqui voy a validar si existen datos
def validate_data():
    if os.path.exists(DATA_FILE):
       with open(DATA_FILE,'r') as f:
           return json.load(f)
    else:
        return "NO EXISTEN DATOS"

#endpoint para consultar datos
@app.route('/users', methods=['GET'])
def get_users():
    data = validate_data()
    if data == "NO EXISTEN DATOS":
        return jsonify({"users": []})
    return jsonify(data)

@app.route('/index', methods=['GET'])
def index():
    return render_template('index.html')

# Ruta para la interfaz de prueba de API
@app.route('/interfaz', methods=['GET'])
def interfaz():
    return render_template('intefaz.html')

#endpoint para consultar datos por id
@app.route('/users/<int:id>', methods=['GET'])
def get_user(id):
    data = validate_data()
    user = next((user for user in data['users'] if user['id'] == id), None)
    if user:
        return jsonify(user)  
    return jsonify({'error': 'User not found'}), 404

@app.route('/create_user', methods=['POST'])
def add_user():
    if not request.is_json:
        return jsonify({'error': 'Missing JSON in request'}), 400
        
    data = validate_data()
    if not isinstance(data, dict) or 'users' not in data:
        data = {'users': []}
        
    try:
        new_id = 1
        if data['users']:  # Si ya hay usuarios, calcula el nuevo ID
            new_id = max(user.get('id', 0) for user in data['users']) + 1
            
        new_user = {
            'id': new_id,
            'firstname': request.json.get('firstname', ''),
            'lastname': request.json.get('lastname', ''),
            'userid': request.json.get('userid', ''),
            'password': request.json.get('password', ''),
            'birthday': request.json.get('birthday', '')
        }
        
        data['users'].append(new_user)
        
        # Guardar los datos en el archivo
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)
            
        return jsonify({'message': 'Usuario creado exitosamente!', 'user': new_user}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

  

@app.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    try:
        data = validate_data()
        if not isinstance(data, dict) or 'users' not in data:
            return jsonify({'error': 'No users found'}), 404
            
        initial_length = len(data['users'])
        data['users'] = [user for user in data['users'] if user.get('id') != id]
        
        if len(data['users']) == initial_length:
            return jsonify({'error': 'User not found'}), 404
            
        # Save the updated data
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)
            
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) #debug=True para que se actualice automaticamente

