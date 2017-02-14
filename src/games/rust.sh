#!/bin/sh
# template shell script to start/stop a server

LABEL=Rust
BASEDIR=$(dirname "$0")
PIDFILE="$BASEDIR/server.pid"
FIFOFILE="$BASEDIR/server.fifo"
cd "${BASEDIR}"

case "$1" in
	start)
		if [ -e $PIDFILE ]; then
			if ( kill -0 $(cat $PIDFILE) 2> /dev/null ); then
				echo "The server is already running, try restart or stop"
				exit 1
			else
				echo "$PIDFILE found, but no server running. Possibly your previously started server crashed"
				rm $PIDFILE
				rm $FIFOFILE
			fi
		fi
		if [ "${UID}" = "0" ]; then
			echo "WARNING ! For security reasons we advise: DO NOT RUN THE SERVER AS ROOT"
			c=1
			while [ "$c" -le 10 ]; do
				echo -n "!"
				sleep 1
				c=$(($c+1))
			done
			echo "!"
		fi
		if [ -e $FIFOFILE ]; then
		    rm $FIFOFILE
		fi
		if [ -e $PIDFILE ]; then
		    rm $PIDFILE
		fi
		echo "Starting $LABEL... "
		mkfifo $FIFOFILE
		$BASEDIR/server/bin/x64/factorio --port {_port_} --start-server $BASEDIR/maps/{_map_}.zip --server-settings $BASEDIR/server-settings.json > $BASEDIR/output.log 2> $BASEDIR/error.log < $FIFOFILE &
		PID=$!
		ps -p ${PID} > /dev/null 2>&1
		if [ "$?" -ne "0" ]; then
			echo "$LABEL could not start"
		else
			echo $PID > $PIDFILE
			echo "$LABEL started"
		fi
	;;
	stop)
		if [ -e $PIDFILE ]; then
			echo -n "Stopping $LABEL... "
			if ( kill -TERM $(cat $PIDFILE) 2> /dev/null ); then
				c=1
				while [ "$c" -le 300 ]; do
					if ( kill -0 $(cat $PIDFILE) 2> /dev/null ); then
						echo -n "."
						sleep 1
					else
						break
					fi
					c=$(($c+1))
				done
			fi
			if ( kill -0 $(cat $PIDFILE) 2> /dev/null ); then
				echo "Server is not shutting down cleanly - killing"
				kill -KILL $(cat $PIDFILE)
			else
				echo "Done"
			fi
			rm $PIDFILE
			rm $FIFOFILE
		else
			echo "Server stopped"
			exit 0
		fi
	;;
	status)
		if [ -e $PIDFILE ]; then
			if ( kill -0 $(cat $PIDFILE) 2> /dev/null ); then
				echo "running"
			else
				echo "stopped"
			fi
		else
			echo "stopped"
		fi
	;;
	*)
		echo "Usage: ${0} {start|stop|status}"
		exit 2
esac
exit 0