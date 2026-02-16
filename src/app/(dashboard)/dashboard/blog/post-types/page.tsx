"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { AxiosError } from "axios";
import Modal from "react-bootstrap/Modal";
import PermissionGuard from "../../../components/PermissionGuard";

// --- Interfaces ---
interface PostType {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginationData {
  current_page: number;
  data: PostType[];
  links: PaginationLink[];
}

export default function PostTypesPage() {
  const router = useRouter();
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchPostTypes = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const api = getApiClientInstance();
      const res = await api.get('/blog/post-types', { params: { page: p } });
      const data = res?.data?.data;
      
      let list: PostType[] = [];
      if (data) {
        if (Array.isArray(data.data)) {
          list = data.data;
          setPagination(data);
        } else if (Array.isArray(data)) {
          list = data;
          setPagination(null);
        }
      } else if (Array.isArray(res?.data)) {
        list = res.data;
        setPagination(null);
      }
      setPostTypes(list);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Failed to load post types', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to load post types');
      setPostTypes([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchPostTypes(page); 
  }, [page, fetchPostTypes]);

  const createPostType = async () => {
    setCreateError(null);
    if (!name.trim() || !description.trim()) {
      setCreateError('Name and description are required');
      return;
    }
    setCreating(true);
    try {
      const api = getApiClientInstance();
      const res = await api.post('/blog/create-post-type', { 
        name: name.trim(), 
        description: description.trim() 
      });
      
      if (res?.data?.success) {
        toast.success(res.data.message || 'Post type created');
        setName(''); 
        setDescription(''); 
        setShowCreateForm(false);
        fetchPostTypes(page);
      } else {
        const msg = res?.data?.message || 'Failed to create post type';
        setCreateError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const msg = error.response?.data?.message || error.message || 'Failed to create post type';
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Post Types</h3>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => window.history.back()}>Back</Button>
          <PermissionGuard permission="Create Post Type">
            <Button variant="outline-success" onClick={() => setShowCreateForm(true)}>Create Post-Type</Button>
          </PermissionGuard>
        </div>
      </div>

      <Modal show={showCreateForm} onHide={() => setShowCreateForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Post Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <Alert variant="danger">{createError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Post type name" 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Short description" 
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateForm(false)}>Close</Button>
          <PermissionGuard permission="Create Post Type">
            <Button variant="primary" onClick={createPostType} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </PermissionGuard>
        </Modal.Footer>
      </Modal>

      {loading ? (
        <div>Loading...</div>
      ) : postTypes.length === 0 ? (
        <div className="text-muted">No post types found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {postTypes.map((pt) => (
                <tr key={pt.id}>
                  <td>{pt.id}</td>
                  <td>{pt.name}</td>
                  <td>{pt.description}</td>
                  <td>{pt.created_at ? new Date(pt.created_at).toLocaleString() : ''}</td>
                  <td>
                    <PermissionGuard permission="View Posts">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => router.push(`/dashboard/blog/post-types/${pt.id}`)}
                      >
                        View Posts
                      </Button>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.links && (
        <nav className="mt-3">
          <ul className="pagination">
            {pagination.links.map((link, idx) => (
              <li key={idx} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  onClick={() => {
                    if (!link.url) return;
                    try {
                      const u = new URL(link.url);
                      const p = u.searchParams.get('page');
                      if (p) setPage(Number(p));
                    } catch { 
                      // Error suppressed as per original logic, but fixed unused variable
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}