#/bin/sh
ACTION_NAME=${1}
IMAGE_TYPE=${2}
PORT=${3}

BASE_NAME="mongodb"
CONTAINER_NAME="${BASE_NAME}_${IMAGE_TYPE}_container"
IMAGE_NAME="${BASE_NAME}_${IMAGE_TYPE}_image"

function clear() {
    stop 
    docker rm ${CONTAINER_NAME}
}

function delete() {
    echo $IMAGE_NAME
    docker rmi ${IMAGE_NAME}
}

function restart() {
    stop 
    start 
}

function start() {
    docker start ${CONTAINER_NAME}
}

function stop() {
    docker stop ${CONTAINER_NAME}
}

function execute() {
    case $1 in
    "start")
        start 
        ;;
    "restart")
        restart 
        ;;
    "stop")
        stop 
        ;;
    "clear")
        clear 
        ;;
    "delete")
       delete 
        ;;
    *)
        echo "Unknown option"
        ;;
    esac
}