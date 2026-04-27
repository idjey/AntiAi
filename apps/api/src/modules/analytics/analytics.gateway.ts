import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // In production, restrict to frontend domain
    },
    namespace: '/analytics'
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AnalyticsGateway.name);
    private activeConnections = new Set<string>();

    handleConnection(client: Socket) {
        this.activeConnections.add(client.id);
        this.broadcastLiveUsersCount();
    }

    handleDisconnect(client: Socket) {
        this.activeConnections.delete(client.id);
        this.broadcastLiveUsersCount();
    }

    // Broadcasts the current active connections count to everyone in the /analytics namespace
    private broadcastLiveUsersCount() {
        const count = this.activeConnections.size;
        this.server.emit('liveUsersCount', { count });
    }
}
