import { supabase } from '../supabase.client';

export class TicketsService {

  private async formatTicket(t: any) {
    const { data: comments } = await supabase
      .from('comentarios')
      .select('id, autor_id, contenido, creado_en, usuarios(username)')
      .eq('ticket_id', t.id)
      .order('creado_en');

    const { data: history } = await supabase
      .from('historial_tickets')
      .select('id, usuario_id, accion, creado_en, usuarios(username)')
      .eq('ticket_id', t.id)
      .order('creado_en');

    return {
      id:               t.id,
      groupId:          t.grupo_id,
      title:            t.titulo,
      description:      t.descripcion || '',
      status:           t.estados?.nombre || 'Pendiente',
      assignedToUserId: t.asignado_id || null,
      createdByUserId:  t.autor_id,
      priority:         t.prioridades?.nombre || 'Media',
      createdAt:        t.creado_en,
      dueDate:          t.fecha_final || null,
      comments: comments?.map((c: any) => ({
        id:        c.id,
        userId:    c.autor_id,
        userName:  c.usuarios?.username || '',
        message:   c.contenido,
        createdAt: c.creado_en,
      })) || [],
      history: history?.map((h: any) => ({
        id:        h.id,
        userId:    h.usuario_id,
        userName:  h.usuarios?.username || '',
        action:    h.accion,
        createdAt: h.creado_en,
      })) || [],
    };
  }

  private async getEstadoId(nombre: string) {
    const { data } = await supabase
      .from('estados').select('id').eq('nombre', nombre).single();
    return data?.id;
  }

  private async getPrioridadId(nombre: string) {
    const { data } = await supabase
      .from('prioridades').select('id').eq('nombre', nombre).single();
    return data?.id;
  }

  async getAll(groupIds?: string[]) {
    let query = supabase
      .from('tickets')
      .select('*, estados(nombre), prioridades(nombre)')
      .order('creado_en', { ascending: false });

    if (groupIds?.length) {
      query = supabase
        .from('tickets')
        .select('*, estados(nombre), prioridades(nombre)')
        .in('grupo_id', groupIds)
        .order('creado_en', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return Promise.all(data.map(t => this.formatTicket(t)));
  }

  async getByGroup(groupId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, estados(nombre), prioridades(nombre)')
      .eq('grupo_id', groupId)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return Promise.all(data.map(t => this.formatTicket(t)));
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, estados(nombre), prioridades(nombre)')
      .eq('id', id).single();
    if (error) throw new Error('Ticket no encontrado');
    return this.formatTicket(data);
  }

  async create(groupId: string, body: any, authorId: string) {
    const estadoId    = await this.getEstadoId(body.status || 'Pendiente');
    const prioridadId = await this.getPrioridadId(body.priority || 'Media');

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        grupo_id:     groupId,
        titulo:       body.title,
        descripcion:  body.description,
        autor_id:     authorId,
        asignado_id:  body.assignedToUserId || null,
        estado_id:    estadoId,
        prioridad_id: prioridadId,
        fecha_final:  body.dueDate || null,
      })
      .select('*, estados(nombre), prioridades(nombre)')
      .single();

    if (error) throw error;

    await supabase.from('historial_tickets').insert({
      ticket_id: data.id, usuario_id: authorId,
      accion: 'Ticket creado', detalles: {},
    });

    return this.formatTicket(data);
  }

  async update(id: string, body: any, userId: string) {
    const estadoId    = body.status   ? await this.getEstadoId(body.status)      : undefined;
    const prioridadId = body.priority ? await this.getPrioridadId(body.priority) : undefined;

    const updateData: any = {};

    if (body.title            !== undefined) updateData.titulo      = body.title;
    if (body.description      !== undefined) updateData.descripcion = body.description;
    if (body.assignedToUserId !== undefined) updateData.asignado_id = body.assignedToUserId || null;
    if (body.dueDate          !== undefined) updateData.fecha_final = body.dueDate || null;
    if (estadoId)    updateData.estado_id    = estadoId;
    if (prioridadId) updateData.prioridad_id = prioridadId;

    const { data, error } = await supabase
      .from('tickets').update(updateData).eq('id', id)
      .select('*, estados(nombre), prioridades(nombre)').single();
    if (error) throw error;

    await supabase.from('historial_tickets').insert({
      ticket_id: id, usuario_id: userId,
      accion: 'Ticket actualizado', detalles: {},
    });

    return this.formatTicket(data);
  }

  async updateStatus(id: string, status: string, userId: string) {
    const estadoId = await this.getEstadoId(status);
    const { data, error } = await supabase
      .from('tickets').update({ estado_id: estadoId }).eq('id', id)
      .select('*, estados(nombre), prioridades(nombre)').single();
    if (error) throw error;

    await supabase.from('historial_tickets').insert({
      ticket_id: id, usuario_id: userId,
      accion: `Estado cambiado a ${status}`, detalles: {},
    });

    return this.formatTicket(data);
  }

  async delete(id: string) {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Ticket eliminado' };
  }

  async addComment(ticketId: string, body: any, userId: string) {
    const { error } = await supabase.from('comentarios').insert({
      ticket_id: ticketId, autor_id: userId, contenido: body.message,
    });
    if (error) throw error;

    await supabase.from('historial_tickets').insert({
      ticket_id: ticketId, usuario_id: userId,
      accion: 'Comentario agregado', detalles: {},
    });

    return this.getById(ticketId);
  }
}