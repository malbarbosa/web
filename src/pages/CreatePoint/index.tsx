import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useHistory } from "react-router-dom";
import {FiArrowLeft} from "react-icons/fi";
import logo from "../../assets/logo.svg";
import {Map, TileLayer, Marker} from "react-leaflet";
import api from "../../services/api";
import Axios from "axios";

import "./styles.css";
import { LeafletMouseEvent } from "leaflet";

interface Item {
    id: number,
    title: string,
    image: string
}

interface UfIBGE {
    sigla: string
}

interface CityNameIBGE {
    nome: string
}


const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedPosition,setSelectedPosition] = useState<[number,number]>([0,0]);
    const [initialPosition,setInitialPosition] = useState<[number,number]>([0,0]);
    const [selectedUf,setSelectedUf] = useState('0');
    const [selectedCity,setSelectedCity] = useState('0');
    const [selectedItems,setSelectedItems] = useState<number[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        email: ''
    });

    const history = useHistory();

    useEffect(()=>{
        api.get('/items').then(response =>{
            setItems(response.data);
        })
    },[]);

    useEffect(()=>{
        Axios.get<UfIBGE[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response =>{
            setUfs(response.data.map(uf => uf.sigla));
        })
    },[]);

    useEffect(()=>{
        Axios.get<CityNameIBGE[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response =>{
            setCities(response.data.map(uf => uf.nome));
        })
    },[selectedUf]);

    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position=>{
            const {latitude, longitude} = position.coords;
            setInitialPosition([latitude,longitude]);
        },error=>{
            setInitialPosition([-12.965478872272989,-38.474657535552986]);
        })
    },[]);

    function hangleUfChange(value: ChangeEvent<HTMLSelectElement>){
        setSelectedUf(value.target.value);
    }

    function hangleCityChange(value: ChangeEvent<HTMLSelectElement>){
        setSelectedCity(value.target.value);
    }

    function handleSelectedPosition(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name, value} = event.target;
        setFormData({...formData,[name]:value})
    }

    function handleSelectedItems(itemId: number){
        let itemSelected = selectedItems.findIndex(item => item === itemId);
        if(itemSelected >= 0){
            let items = selectedItems.filter(item => item !== itemId);
            setSelectedItems(items);
        }else{
           setSelectedItems([...selectedItems,itemId]);
        }
        
    }

    async function handleOnSubmit(event: FormEvent){
        event.preventDefault();
        const {name, whatsapp, email} = formData;
        const city = selectedCity; 
        const uf = selectedUf; 
        const [longitude, latitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,whatsapp,email, city,uf,longitude,latitude, items
        }

       await api.post('/points',data);

       alert('Ponto cadastrado com sucesso');

       history.push("/");
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft/>
                    Volta para Home
                </Link>
            </header>
            <form onSubmit={handleOnSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name"id="name" onChange={handleInputChange}/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email"id="email" onChange={handleInputChange}/>
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp"id="whatsapp" onChange={handleInputChange}/>
                        </div>
                    </div>

                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o Endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={17} onClick={handleSelectedPosition}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}/>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">UF</label>
                            <select 
                                name="uf" 
                                id="uf" 
                                onChange={hangleUfChange}
                                value={selectedUf}>
                                <option value="0">Selecione</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city" 
                                onChange={hangleCityChange}
                                value={selectedCity}>
                                <option value="0">Selecione</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de Coleta</h2>
                        <span>Selecione os itens de coleta</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={()=>handleSelectedItems(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected': ''}>
                               <img src={item.image} alt={item.title}/>
                                <span>{item.title}</span>
                           </li> 
                        ))}
                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
}

export default CreatePoint;