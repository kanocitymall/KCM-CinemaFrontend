"use client";
import PageHeader from "../../components/page-header";

const ConfigurationListPage = () => {
  return (
    <section>
      <PageHeader title="Configuration">
        <div className="d-flex gap-2 align-items-center">
          {/* Add any buttons if needed */}
        </div>
      </PageHeader>

      <section className="pt-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Configuration Options</h5>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <a href="/configuration/company-settings" className="text-decoration-none">
                  Company Settings
                </a>
              </li>
              <li className="list-group-item">
                <a href="/configuration/activity-logs" className="text-decoration-none">
                  Activity Logs
                </a>
              </li>
              {/* Add more configuration options here */}
            </ul>
          </div>
        </div>
      </section>
    </section>
  );
};

export default ConfigurationListPage;