#/bin/sh
. ../common.sh


build() {
    docker build  -t ${IMAGE_NAME} ../../../docker/mongodb/${IMAGE_TYPE}/
}

run() {
    mkdir -p ${HOSTDATAPATH}
    docker run -d -p ${PORT}:27017 --name ${CONTAINER_NAME} -v ${HOSTDATAPATH}:/data/db  ${IMAGE_NAME} 
}

execute_action() {
    case ${ACTION_NAME} in
    "build")
        build 
        ;;
    "run")
        clear
        run
        ;;
    *)
        execute ${ACTION_NAME} ${CONTAINER_NAME}
        ;;
    esac
}

if [ "$#" -eq 2 ] && \
( [ "${ACTION_NAME}" = "build" ] || [ "${ACTION_NAME}" = "start" ] || \
[ "${ACTION_NAME}" = "stop" ] || [ "${ACTION_NAME}" = "restart" ]|| \
[ "${ACTION_NAME}" = "clear" ] || [ "${ACTION_NAME}" = "delete" ] ) && \
([ "${IMAGE_TYPE}" = "anon" ] || [ "${IMAGE_TYPE}" = "auth" ] ); then
    execute_action 
elif [ "$#" -eq 3 ] && [ "${ACTION_NAME}" = "run" ]; then
    execute_action 
else
    echo "Usage: ./execute.sh [build | run | start | stop | restart | clear | delete] [anon | auth] [port(for run)]"
fi
