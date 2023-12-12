#/bin/sh
ACTION_NAME=${1}
IMAGE_TYPE=${2}
PORT=${3}
HOSTDATAPATH="/var/tmp/container-data-${IMAGE_TYPE}"

BASE_NAME="mongodb"
CONTAINER_NAME="${BASE_NAME}_${IMAGE_TYPE}_container"
IMAGE_NAME="${BASE_NAME}_${IMAGE_TYPE}_image"

clear() {
    stop 
    docker rm ${CONTAINER_NAME}
    rm -rf ${HOSTDATAPATH}
}

delete() {
    echo $IMAGE_NAME
    docker rmi ${IMAGE_NAME}
}

restart() {
    stop 
    start 
}

start() {
    docker start ${CONTAINER_NAME}
}

stop() {
    docker stop ${CONTAINER_NAME}
}

execute() {
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