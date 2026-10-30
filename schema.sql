CREATE TABLE IF NOT EXISTS items (
  id          VARCHAR(40)  NOT NULL PRIMARY KEY,
  title       VARCHAR(160) NOT NULL,
  category    VARCHAR(40)  NOT NULL,
  type        ENUM('Lost','Found') NOT NULL,
  status      ENUM('Lost','Found','Claimed') NOT NULL,
  location    VARCHAR(200) NOT NULL,
  item_date   DATE         NOT NULL,
  description TEXT,
  image       MEDIUMTEXT,
  reported_by VARCHAR(80)  NOT NULL DEFAULT 'Student',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);
