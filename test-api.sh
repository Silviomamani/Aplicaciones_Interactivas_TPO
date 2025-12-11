#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
EQUIPO_ID=""
TAREA_ID=""

echo -e "${YELLOW}=== TESTING TASK MANAGER API ===${NC}"

# Test 1: Health Check
echo -e "\n${YELLOW}1. Testing Health Check...${NC}"
response=$(curl -s $BASE_URL/health)
if [[ $response == *"success\":true"* ]]; then
    echo -e "${GREEN}Health check passed${NC}"
else
    echo -e "${RED}Health check failed${NC}"
    exit 1
fi

# Test 2: Login
echo -e "\n${YELLOW}2. Testing Login...${NC}"
login_response=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana@example.com",
    "password": "123456"
  }')

if [[ $login_response == *"success\":true"* ]]; then
    TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    echo -e "${GREEN}Login successful${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}Login failed${NC}"
    echo $login_response
    exit 1
fi

# Test 3: Create Team
echo -e "\n${YELLOW}3. Testing Create Team...${NC}"
team_response=$(curl -s -X POST $BASE_URL/equipos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Equipo Test API",
    "descripcion": "Equipo creado por script de testing",
    "color": "#FF5733"
  }')

if [[ $team_response == *"success\":true"* ]]; then
    EQUIPO_ID=$(echo $team_response | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
    echo -e "${GREEN}Team created successfully${NC}"
    echo "Team ID: $EQUIPO_ID"
else
    echo -e "${RED}Team creation failed${NC}"
    echo $team_response
    exit 1
fi

# Test 4: Create Task
echo -e "\n${YELLOW}4. Testing Create Task...${NC}"
task_response=$(curl -s -X POST $BASE_URL/tareas/$EQUIPO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Tarea Test API",
    "descripcion": "Tarea creada por script de testing",
    "prioridad": "alta",
    "fechaLimite": "2025-09-25T23:59:59.000Z"
  }')

if [[ $task_response == *"success\":true"* ]]; then
    TAREA_ID=$(echo $task_response | grep -o '"id":"[^"]*' | head -1 | grep -o '[^"]*$')
    echo -e "${GREEN}Task created successfully${NC}"
    echo "Task ID: $TAREA_ID"
else
    echo -e "${RED}Task creation failed${NC}"
    echo $task_response
    exit 1
fi

# Test 5: List Tasks (CORREGIDO - usar la misma ruta que crear)
echo -e "\n${YELLOW}5. Testing List Tasks...${NC}"
list_response=$(curl -s -X GET $BASE_URL/tareas/$EQUIPO_ID \
  -H "Authorization: Bearer $TOKEN")

if [[ $list_response == *"success\":true"* ]]; then
    echo -e "${GREEN}Tasks listed successfully${NC}"
else
    echo -e "${RED}Task listing failed${NC}"
    echo $list_response
fi

# Test 6: Update Task Status (CORREGIDO)
echo -e "\n${YELLOW}6. Testing Update Task Status...${NC}"
update_response=$(curl -s -X PUT $BASE_URL/tareas/$EQUIPO_ID/$TAREA_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "en_curso"
  }')

if [[ $update_response == *"success\":true"* ]]; then
    echo -e "${GREEN}Task updated successfully${NC}"
else
    echo -e "${RED}Task update failed${NC}"
    echo $update_response
fi

# Test 7: Add Comment (CORREGIDO)
echo -e "\n${YELLOW}7. Testing Add Comment...${NC}"
comment_response=$(curl -s -X POST $BASE_URL/tareas/$EQUIPO_ID/$TAREA_ID/comentarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contenido": "Comentario de prueba desde script automatizado"
  }')

if [[ $comment_response == *"success\":true"* ]]; then
    echo -e "${GREEN}Comment added successfully${NC}"
else
    echo -e "${RED}Comment addition failed${NC}"
    echo $comment_response
fi

# Test 8: Get Activity
echo -e "\n${YELLOW}8. Testing Get Activity...${NC}"
activity_response=$(curl -s -X GET $BASE_URL/actividad/usuario \
  -H "Authorization: Bearer $TOKEN")

if [[ $activity_response == *"success\":true"* ]]; then
    echo -e "${GREEN}Activity retrieved successfully${NC}"
else
    echo -e "${RED}Activity retrieval failed${NC}"
    echo $activity_response
fi

echo -e "\n${GREEN}=== ALL TESTS COMPLETED ===${NC}"
echo "Team ID: $EQUIPO_ID"
echo "Task ID: $TAREA_ID"