"use client";

import { MdAdd } from "react-icons/md";
import Link from "next/link";
import { IoFilter } from "react-icons/io5";
import { Modal } from "react-bootstrap";
import { useEffect, useState, useMemo } from "react"; // Added useMemo
import { FaRegEdit } from "react-icons/fa";
import { ApiResponse, PaginatedData } from "./type";
import UserForm, { UserData } from "./components/user-form";
import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import PermissionGuard from "../../components/PermissionGuard";

export interface User extends UserData {
  status: number;
  role: { id: number; name: string; description: string };
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginatedData<User> | null>(null);
  const [refetch, setRefetch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);

  // ✅ Fix Warning: Memoize API client
  const api = useMemo(() => getApiClientInstance(), []);

  const handleCloseUserModal = () => {
    setShowAddUserModal(false);
    setSelectedUser(null);
  };

  // 🔹 API: Fetch users
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // ✅ Fix Errors: Add generic type to define the shape of res.data.data
        const res = await api.get<ApiResponse<User[] | PaginatedData<User>>>(`/users?page=${currentPage}`);
        
        const responseData = res.data.data;
        
        // Handle both array response and paginated response
        if (Array.isArray(responseData)) {
          setUsers(responseData);
          setPagination(null);
        } else {
          setUsers(responseData?.data || []);
          setPagination(responseData);
        }
      } catch (err: unknown) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
        setRefetch(false);
      }
    };

    loadData();
  }, [api, currentPage, refetch]); // ✅ Added api to dependencies

  const updateUserStatus = async (user: User) => {
    const prevUsers = [...users];
    const newStatus = user.status === 1 ? 0 : 1;
    
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    setUpdatingId(user.id);

    try {
      await api.patch(`users/toggle-user-status/${user.id}`);
    } catch (error: unknown) {
      console.error("Toggle failed:", error);
      setUsers(prevUsers);
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchUserDetailsForEdit = async (userId: number) => {
    setLoadingUserId(userId);
    try {
      // ✅ Explicitly type the individual user response if possible
      const res = await api.get<ApiResponse<User>>(`/users/get-user/${userId}`);
      const data = res.data?.data;
      if (data) {
        setSelectedUser(data);
        setShowAddUserModal(true);
      }
    } catch (error: unknown) {
      console.error("Load edit failed:", error);
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <section>
      <PageHeader title="USERS">
        <div className="d-flex gap-2 align-items-center">
          <button className="btn d-none d-md-flex align-items-center gap-2 border"><IoFilter /> Filter</button>
          <input type="search" className="form-control tw-text-sm d-none d-md-block" placeholder="Search users..." />
          <PermissionGuard permission="Create User">
            <button className=" d-flex btn btn-warningalign-items-center gap-2 text-nowrap" onClick={() => { setSelectedUser(null); setShowAddUserModal(true); }}>
              <MdAdd /> Add User
            </button>
          </PermissionGuard>
        </div>
      </PageHeader>

      {loading ? (
        <Loading />
      ) : (
        <div className="table-responsive mt-4 bg-white rounded shadow-sm">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
            <thead className="table-light text-secondary">
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th className="d-none d-lg-table-cell">Email</th>
                <th>Role</th>
                <th>Status</th>
               <th className="text-center">
                 <PermissionGuard permission="Edit User">Action</PermissionGuard>
               </th>
               <th className="text-center">
                 <PermissionGuard permission="Show User">View</PermissionGuard>
               </th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user, i) => (
                <tr key={user.id}>
                  <td>{((currentPage - 1) * (pagination?.per_page || 10)) + i + 1}</td>
                  <td><strong>{user.name}</strong></td>
                  <td className="d-none d-lg-table-cell text-muted">{user.email}</td>
                  <td><span className="badge bg-light text-dark border fw-normal">{user.role?.name}</span></td>
                  <td>
                    <PermissionGuard permission="Edit User">
                      <div className="form-check form-switch d-flex align-items-center gap-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={user.status === 1}
                          disabled={updatingId === user.id}
                          onChange={() => updateUserStatus(user)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span className={`fw-bold ${user.status === 1 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '10px' }}>
                          {user.status === 1 ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </PermissionGuard>
                  </td>
                  <td className="text-center">
                    <PermissionGuard permission="Edit User">
                      <button className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => fetchUserDetailsForEdit(user.id)} disabled={loadingUserId === user.id}>
                        {loadingUserId === user.id ? <div className="spinner-border spinner-border-sm" /> : <><FaRegEdit /> Edit</>}
                      </button>
                    </PermissionGuard>
                  </td>
                  <td className="text-center">
                    <PermissionGuard permission="Show User">
                      <Link href={`/user/user-list/details/${user.id}`} className="btn btn-sm btn-outline-success">Details</Link>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.links && (
            <nav className="p-3 d-flex justify-content-center border-top">
              <ul className="pagination pagination-sm mb-0">
                {pagination.links.map((link, index) => (
                  <li key={index} className={`page-item ${link.active ? "active" : ""} ${!link.url ? "disabled" : ""}`}>
                    <button className="page-link" dangerouslySetInnerHTML={{ __html: link.label }} onClick={() => {
                        if (link.url) {
                          const url = new URL(link.url);
                          const page = url.searchParams.get("page");
                          if (page) setCurrentPage(Number(page));
                        }
                    }} />
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      )}

      <Modal show={showAddUserModal} onHide={handleCloseUserModal} centered>
        <Modal.Header closeButton className="border-bottom-0" />
        <Modal.Body>
          <UserForm 
            user={selectedUser} 
            setRefetch={setRefetch} 
            onClose={handleCloseUserModal}
          />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default Users;