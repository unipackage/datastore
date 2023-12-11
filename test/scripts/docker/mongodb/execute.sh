#/bin/sh
source ../common.sh

ACTION_NAME=${1}

BASE_NAME="mongodb"
IMAGE_TYPE=${2}
CONTAINER_NAME="${BASE_NAME}_${IMAGE_TYPE}_container"
IMAGE_NAME="${BASE_NAME}_${IMAGE_TYPE}_image"

function build() {
    docker build -t ${IMAGE_NAME} "../../../docker/mongo/${IMAGE_TYPE}/"
}

function run() {
if [ "${IMAGE_TYPE}" = "anon" ] ; then
    docker run -d -p 27017:27017 --name ${CONTAINER_NAME}  ${IMAGE_NAME}
else
    docker run -d -p 27018:27017 --name ${CONTAINER_NAME}  ${IMAGE_NAME}
fi
}

function execute_action() {
    case ${ACTION_NAME} in
    "build")
        build 
        ;;
    "delete")
        delete ${IMAGE_NAME}
        ;;
    "run")
        clear ${CONTAINER_NAME} 
        run
        ;;
    *)
        execute ${ACTION_NAME} ${CONTAINER_NAME}
        ;;
    esac
}

if [ "$#" -eq 2 ] && \
( [ "$1" = "build" ] || [ "$1" = "run" ] || \
[ "$1" = "start" ] || [ "$1" = "stop" ]|| [ "$1" = "restart" ] || [ "$1" = "clear" ]|| [ "$1" = "delete" ]) && \
( [ "$2" = "anon" ] || [ "$2" = "auth" ] ); then
    execute_action $1
else
    echo "Usage: ./execute.sh [build | run | start | stop | restart | clear | delete] [anon | auth]"
fi

