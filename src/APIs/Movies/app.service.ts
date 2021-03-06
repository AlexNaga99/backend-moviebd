import { Injectable } from '@nestjs/common';
import { interfaceMovies, interfaceFavoriteMovies, interfaceInsertMovies, interfaceDeleteMovie, interfaceFavoritesMovies } from './interface';
import { request } from '../../Connection/http';
import { executeQuery  } from '../../Connection/mysql';
@Injectable()
export class AppService {

  async getMoviesByPage(pageNumber: interfaceMovies) {
    try {
      let result = await request.get(`${process.env.API_URL}/3/movie/top_rated?api_key=${process.env.API_KEY}&page=${pageNumber}`);
      if(result.status === 200){
        return [{ erro: [], data: result.data }];
      }
      else {
        return [{ erro: 'Problema na requisição.', data: [] }];
      }
    } catch (error) {
      return [{ erro: error.message, data: [] }];
    }
  }

  async getFavoriteMovies(userId: interfaceFavoriteMovies, status: number) {
    try {

      let query = ` SELECT 
                      *
                    FROM ${process.env.DATABASE}.movies
                    WHERE idCustomer = ${userId} AND favorite = ${status}`;
                    
      let mysql = await executeQuery(query);
      let response_query = mysql[0];
      let movies = [];

      if(!response_query.erro){
          for (const obj of response_query.data) {
            let result = await request.get(`${process.env.API_URL}/3/movie/${obj.idMovie}?api_key=${process.env.API_KEY}`);
            if(result.status === 200){
              movies.push(result.data);
            }
          }
      }
      return [{ erro: '', data: movies }];
    } catch (error) {
      return [{ erro: error, data: [] }];
    }
  }

  async insertMovie(body: interfaceInsertMovies) {
    try {
      
      let exists = await this.existisMovieInList(body);
      if(!exists[0].data[0]){

        let query = ` INSERT INTO ${process.env.DATABASE}.movies 
        (
          idCustomer,
          idMovie,
          favorite
        ) 
      value 
        (
          ${body.idCustomer},
          ${body.idMovie},
          ${body.favorite}
        );`;

        let mysql = await executeQuery(query);
        return mysql;
      }
      else {
        return [{ erro: 'Filme já existe em sua lista.', data: [] }];
      }
    } catch (error) {
      return [{ erro: error, data: [] }];
    }
  }

  async deleteMovie(id: interfaceDeleteMovie) {
    try {

      let query = `DELETE FROM ${process.env.DATABASE}.movies WHERE id = ${id}`;

      let mysql = await executeQuery(query);
      return mysql;
    } catch (error) {
      return [{ erro: error, data: [] }];
    }
  }

  async insertFavoriteMovie(body: interfaceInsertMovies) {
    try {
      
      let exists = await this.existisMovieInList(body);
      if(exists[0].data[0]){

        let obj : interfaceFavoritesMovies = {
          id: body.idCustomer
        }

        let favorites = await this.existisFavoriteMovies(obj);
        if(favorites[0].data[0]){
          let quantity_favorite = favorites[0].data[0].favoritos;
          if(quantity_favorite < 5 && body.favorite === true || body.favorite === false){
            let query = ` UPDATE ${process.env.DATABASE}.movies 
                          SET 
                            favorite = ${body.favorite} 
                          WHERE idCustomer = ${body.idCustomer}
                          AND idMovie = ${body.idMovie};
                          `;

            let mysql = await executeQuery(query);
            return mysql;
          }
          else {
            return [{ erro: 'Quantidade máxima de filmes favoritos foi excedido.', data: [] }];
          }
        }
      }
      else {
        return [{ erro: 'Filme não existe na sua lista.', data: [] }];
      }
    } catch (error) {
      return [{ erro: error, data: [] }];
    }
  }

  async existisMovieInList(body: interfaceInsertMovies) {
    try {

      let query = ` SELECT 
                      id
                    FROM ${process.env.DATABASE}.movies
                    WHERE idMovie = ${body.idMovie} AND idCustomer = ${body.idCustomer}`;
                    
      let mysql = await executeQuery(query);
      return mysql;
    } catch (error) {
      return [{ erro: error, data: [] }];
    }
  }

  async existisFavoriteMovies(body: interfaceFavoritesMovies) {
    try {

      let query = ` SELECT 
                      COUNT(id) AS favoritos
                    FROM ${process.env.DATABASE}.movies
                    WHERE idCustomer = ${body.id} AND favorite = 1;`;
                    
      let mysql = await executeQuery(query);
      return mysql;
    } catch (error) {
      return [{ erro: error, data: [] }];
    }
  }
}
