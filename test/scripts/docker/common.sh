#/bin/sh
function clear() {
    stop $1
    docker rm $1
}

function delete() {
    docker rmi $1
}

function restart() {
    stop $1
    start $1
}

function start() {
    docker start $1
}

function stop() {
    docker stop $1
}

function execute() {
    case $1 in
    "start")
        start $2
        ;;
    "restart")
        restart $2
        ;;
    "stop")
        stop $2
        ;;
    "clear")
        clear $2
        ;;
    *)
        echo "Unknown option"
        ;;
    esac
}