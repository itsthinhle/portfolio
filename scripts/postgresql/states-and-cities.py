import pandas as pd
from sqlalchemy import inspect
from typing import List
from sqlalchemy import VARCHAR, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import BaseModel
from sqlalchemy import create_engine

### DATABASE CONNECTION & ENGINE

host = '?'
port = '?'
user = '?'
password = '?'
database_name = '?'

# https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#module-sqlalchemy.dialects.postgresql.psycopg
# https://www.psycopg.org/psycopg3/docs/basic/install.html#
# pip install --upgrade pip
# pip install "psycopg[binary]"
# postgresql+psycopg://user:password@host:port/dbname[?key=value&key=value...]
DATABASE_URL = f'''postgresql+psycopg://{user}:{password}@{host}:{port}/{database_name}'''

database_engine = create_engine(DATABASE_URL)

### MODELS

class StateModel(BaseModel):
    __tablename__ = "states"

    id: Mapped[str] = mapped_column(VARCHAR(2), primary_key=True)
    name: Mapped[str] = mapped_column(VARCHAR(25))

    # One state has many cities
    cities: Mapped[List["CityModel"]] = relationship(
        back_populates = "state",
        cascade = "all, delete-orphan"
    )

class CityModel(BaseModel):
    __tablename__ = "cities"

    # Composit key
    state_id: Mapped[str] = mapped_column(VARCHAR(2), ForeignKey('states.id'), primary_key=True)
    county: Mapped[str] = mapped_column(VARCHAR(30), primary_key=True)
    city: Mapped[str] = mapped_column(VARCHAR(45), primary_key=True)

    state: Mapped["StateModel"] = relationship(back_populates="cities")


### DATA PROCESS
# Read US cities data
# Note: may need to move the file in the same folder of the script
us_cities_df = pd.read_csv('uscities.csv')

# Trim columns
us_cities_df['state_id'] = us_cities_df['state_id'].str.strip()
us_cities_df['state_name'] = us_cities_df['state_name'].str.strip()
us_cities_df['county_name'] = us_cities_df['county_name'].str.strip()
us_cities_df['city_ascii'] = us_cities_df['city_ascii'].str.strip()

# Extract into state_df
state_df = us_cities_df[['state_id', 'state_name']]
# Rename columns
state_df = state_df.rename(columns={"state_id": "id", "state_name": "name"})
# Drop duplicates and sort
state_df = state_df.drop_duplicates().sort_values('name')
# Drop rows which are not states
state_df = state_df[(
        (state_df['name'] != 'Puerto Rico') &
        (state_df['name'] != 'District of Columbia')
)]


# Extract into city_df
city_df = us_cities_df[['state_id', 'county_name', 'city_ascii']]
# Rename columns
city_df = city_df.rename(columns={
    "county_name": "county",
    "city_ascii": "city"
})
# Drop duplicates and sort
city_df = (city_df
    .drop_duplicates(subset=['state_id', 'county', 'city'])
    .sort_values(by=['state_id', 'city']))
# Filter cities in valid states
city_df = city_df[city_df['state_id'].isin(state_df['id'])]

# Create an inspector
inspector = inspect(database_engine)

# Drop if cities and states tables exist
if (CityModel.__tablename__ in inspector.get_table_names()
        or StateModel.__tablename__ in inspector.get_table_names()):
    CityModel.__table__.drop(database_engine, checkfirst=True)
    StateModel.__table__.drop(database_engine, checkfirst=True)

# Create tables
StateModel.__table__.create(database_engine, checkfirst=True)
CityModel.__table__.create(database_engine, checkfirst=True)

# Import states to database
try:
    state_df.to_sql(StateModel.__tablename__,
                    con=database_engine,
                    # Don't replace table, use append instead
                    if_exists="append",
                    index=False,
                    method="multi")
    print(f'Successfully inserted data into the states table')
except Exception as exception:
    print(f'Failed to insert data into the states table. Error: {exception}')

# Import cities to database
try:
    city_df.to_sql(CityModel.__tablename__,
                    con=database_engine,
                    # Don't replace table, use append instead
                    if_exists="append",
                    index=False)
    print(f'Successfully inserted data into the cities table')
except Exception as exception:
    print(f'Failed to insert data into the states table. Error: {exception}')
